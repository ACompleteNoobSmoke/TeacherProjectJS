const http = require('http');
var express = require('express')
const bodyParser = require("body-parser");
var app = express();
var path = require('path');
const fs = require('fs');
var mysql = require('mysql');
const { resolve } = require('url');
var jsdom = require("jsdom");
var JSDOM = jsdom.JSDOM;
//const bootstrap = require('bootstrap')
const port = 3000;
var alert = require('alert');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'pages'));

var document = new JSDOM(`<div class = "info-graphic" id="infoshow">`);

var teacherObject = {
    FirstName: undefined,
    LastName: undefined,
    UserName: undefined,
    PassWord: undefined,
    Gender: undefined
};

var studentObject = {
    IDNumber: undefined,
    FirstName: ' ',
    LastName: ' ',
    Gender: undefined,
    SchoolYear: undefined
};


var studentLists = {};

var reportObject = {
    Code: undefined,
    Name: undefined,
    Credit: undefined,
    Grade: undefined
};

var testReport = {
    Code : 'CS 255',
    Name: 'Data Structure',
    Credit: '3.0',
    Grade: 'A'
};

var reportsArray = {};

var classCodes = ['CS 255', 'MATH 101', 'PSY 322', 'BIO 413', 'SCI 420'];
var classNames = ['Data Structure', 'Intro To Algebra', 'Intermediate Psychology', 'Advanced Biology', 'Sciences Of Gas & Elements'];
var classCredits = ['3.0', '2.0', '3.0', '4.0', '4.0'];

//Used to get the styles folder
app.use(express.static(path.join(__dirname, "/styles")));

//Used to get the images folder
app.use(express.static(path.join(__dirname, "/images")));

//Used to parse the data in the body
app.use(bodyParser.urlencoded({
    extended: true
}));

//Used to turn the body data to json
app.use(bodyParser.json());

//Used to get a localhost page
app.listen(port);

//Used to get Index Page
app.get("/", function(request, response){
    console.log('Work');
    response.sendFile(__dirname + "/pages/index.html");
});

//Used to get to Sign in page
app.get("/signin", function(req, res){
    console.log("Sign In");
    res.sendFile(__dirname + "/pages/login.html");
})

//Used to post sign in info to get teacher information in the database
app.post("/signInTeacher", function(req, res){
    var teacherInfo = req.body.User;
    getTeacher(teacherInfo).then(function(teach){
        if(typeof teach !== 'undefined'){
            teacherObject = teach;
            res.redirect('/updateStudentList');
        }else{
            res.redirect('/signin');
        }
    });
})

//Used to get to Register page
app.get("/teacherReg", function(req, res){
    console.log("Teacher Registration");
    res.sendFile(__dirname + "/pages/teacherregister.html");
})

//Used to verifying the information from register
app.post("/verifyTeacher", function(req, res){
    var teacherInfo = req.body.teacher;
    console.log("Verifying The Sign In Info");
    checkUsername(teacherInfo.userName).then(function (exist){
        if(exist){
            alert("UserName Exists");
            return false;
        }else{
            res.redirect(307, '/saveTeacher');
        }
    });
});

//Enter the teacher information into the database
app.post("/saveTeacher", function(req, res){
    var teacherInfo = req.body.teacher;
    enterTeacherInfo(teacherInfo);
    res.redirect('/updateStudentList');
})

//Update Student List
app.get("/updateStudentList", function(req, res){
    if(typeof teacherObject.UserName !== 'undefined'){
        studentObject.FirstName = '';
        studentObject.LastName = '';
        getAllStudents();
        return res.redirect('/TeacherHomePage');
    }
    res.redirect("/"); 
})

//Enter HomePage For Teachers
app.get("/TeacherHomePage", function(req, res){
    if(typeof teacherObject.UserName !== 'undefined'){
        return res.render("teacherHomepage", {
            name: genderTitle(teacherObject) + teacherObject.LastName,
            student: studentLists
        });
    }
    res.redirect("/"); 
})

//Enter Add Student Page For Teachers
app.get("/AddStudentPage", function(req, res){
    if(typeof teacherObject.UserName !== 'undefined'){
        return res.render("addingStudent", {
            name: genderTitle(teacherObject) + teacherObject.LastName
        });
    }
    res.redirect("/");  
});

//
app.post("/SearchDatabase", function(req, res){
    var s = req.body.searchedName;
    getStudentObjectByID(s).then(function(student){
        if(typeof student !== 'undefined'){
            insertToStudentObject(student)
        }
        res.redirect("/SearchStudentPage");
    });

})

//Used to verifying the information from register
app.post("/addStudentToDB", function(req, res){
    if(typeof teacherObject.UserName !== 'undefined'){
        console.log("Adding Student To Database");
        var studentInfo = req.body.student;
        var studentID = createIDFromName(studentInfo.FirstName, studentInfo.LastName)
        enterStudentInfo(studentID, studentInfo).then(function(entered){
            if(entered) saveRecord(studentID);
            var message = entered ? "Student Has Been Saved To The Database" : "Error";
            alert(message);
        });
        return res.redirect("/AddStudentPage");
    }
    res.redirect("/");
});

//Enter Searching Page
app.get("/SearchStudentPage", function(req, res){
    if(typeof teacherObject.UserName !== 'undefined'){
        if(studentObject !== 'undefined'){
        //    var show = req.body.infoshow;
        //    show = 'visible';
        }
        return res.render("searchStudentPage", {
            name: genderTitle(teacherObject) + teacherObject.LastName,
            grades: testReport,
            firstname: studentObject.FirstName,
            lastname: studentObject.LastName
        });
    }
    res.redirect("/");   
})



//Signing Out
app.get("/signout", function(req, res){
    alert("Signing Off");
    teacherObject.UserName = undefined;
    res.redirect("/");
})




//***************HELPER METHODS ****************/
function genderTitle(teacherObject){
    var title = "Mr. ";
    if(teacherObject.Gender.includes('Female')){
        title = "Mrs. ";
    }
    return title;
}

function insertToObject(teacherInfo){
    teacherObject.FirstName = teacherInfo.firstName;
    teacherObject.LastName = teacherInfo.lastName;
    teacherObject.UserName = teacherInfo.userName;
    teacherObject.PassWord = teacherInfo.passWord;
    teacherObject.Gender = teacherInfo.Gender;
}

function insertToStudentObject(foundStudent){
    studentObject.IDNumber = foundStudent.IDNumber;
    studentObject.FirstName = foundStudent.FirstName;
    studentObject.LastName = foundStudent.LastName;
    studentObject.Gender = foundStudent.Gender;
    studentObject.SchoolYear = foundStudent.SchoolYear;
}



function getAllStudents(){
    getStudentAllTeacher().then(function(results){
        studentLists = results;
    })
}

function createIDFromName(firstName, lastName){
    var idString = firstName.charAt(getRandomNumber(firstName.length)) + 
    lastName.charAt(getRandomNumber(lastName.length));
    var numbers = getRandomNumbersString(); 
    idString = idString.concat(numbers).toUpperCase(idString);
    getStudentByID(idString).then(function (exist){
        if(exist) console.log("ID Exist");
    });
    return idString;   
}

function getRandomNumber(max){
    return Math.floor(Math.random() * max);
}

function getRandomNumbersString(){
    var numbers = "";
    var i = 0;
    while(i < 4){
        var num = getRandomNumber(10); 
        numbers += num;
        i++;
    } 
    return numbers;
}

function getCharacter() {
    var characters = 'ABCDF';
    var charactersLength = characters.length;
    return characters.charAt(Math.floor(Math.random() * charactersLength));
}

function setClassGrade(index){
    var rep = reportObject;
    rep.Code = classCodes[index];
    rep.Name = classNames[index];
    rep.Credit = classCredits[index];
    rep.Grade = getCharacter();
    return rep;
}

function setStudentReportCard(){
    var reportCards = []
    for(var i = 0; i < 4; i++){
        reportCards = setClassGrade(i);
    }
    return reportCards;
}

function saveRecord(idNumber){
    for(var i = 0; i < 4; i++){
        var reportCard = setClassGrade(i);
        enterStudentGrades(idNumber, reportCard);
    }
}


//***************DATABASE METHODS********** */

//Create connection for database
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    port: 3306,
    password: "codingroot1!",
    db: "TeacherDB"
});

//Connect to the database
con.connect(function(err){
    if(err) throw err;
    con.query('Use TeacherDB;');
    console.log("Connected!");
})

//Get teacher data from the sign in information
function getTeacher(teacherInfo){
    return new Promise((resolve, reject) => {
        var sql = "Select * From TeacherInfo Where UserName = '" + teacherInfo.userName + "' AND PassWord = '" + teacherInfo.passWord + "';";
        con.query(sql, function (err, result) {
        if (err) throw err;
        console.log("Selecting From Teacher Table");
        resolve(result[0]);
        });
    });
}

//Check if username exists in database
function checkUsername(username){
    return new Promise((resolve, reject) => {
        var sql = "Select * From TeacherInfo Where UserName = '" + username + "';";
        con.query(sql, function(err, result){
            var exist = false;
            var check = result[0];
            if(err){
               throw err; 
            } else if(typeof check === 'undefined'){
                console.log("Username is Unique");
            }else if(typeof check  !== 'undefined'){
                console.log(result[0]);
                console.log("Database: " + check.UserName + " || Username Entered: " + username);
                exist = true;
            }
            resolve(exist);
        });
    });
}

//Enter information into database
function enterTeacherInfo(teacherInfo){
    var sql = "INSERT INTO TeacherInfo (FirstName, LastName, UserName, PassWord, Gender)" +
    " VALUES ('" + teacherInfo.firstName + "', '" + teacherInfo.lastName + "', '" + teacherInfo.userName + "', '" + teacherInfo.passWord + "', '" + teacherInfo.Gender + "');";
    con.query(sql, function (err, result) {
    if (err) throw err;
        console.log("1 record inserted");
        insertToObject(teacherInfo);
    });
}

//Get Student by ID Number & TeacherUserName
function getStudentByTeachernID(idString){
    return new Promise((resolve, reject) => {
        var sql = "Select * From StudentInfo Where TeacherUsername = '" + teacherObject.UserName + "' AND IDNumber = '" + idString + "';";
        con.query(sql, function (err, result) {
        if (err) throw err;
        if(typeof result[0] === 'undefined') resolve(undefined);
        console.log("Selecting Student Table Using Teacher UserName");
        console.log(result[0].FirstName);
        resolve(result[0]);
        });
    });
}

//Get All Students by TeacherUserName
function getStudentAllTeacher(){
    return new Promise((resolve, reject) => {
        var sql = "Select * From StudentInfo Where TeacherUsername = '" + teacherObject.UserName + "';";
        con.query(sql, function (err, result) {
        if (err) throw err;
        if(typeof result === 'undefined') console.log("Result Is Undefined");
        console.log("Selecting All Students By Teacher");
        resolve(result);
        });
    });
}

//Get Student By ID
function getStudentByID(idString){
    return new Promise((resolve, reject) => {
        var sql = "Select * From StudentInfo Where IDNumber = '" + idString + "';";
        con.query(sql, function (err, result) {
        console.log(result[0]);
        var studentExists = true;
        if (err) throw err;
        if(typeof result[0] === 'undefined') studentExists = false;
        console.log("Searching Student Table");
        resolve(studentExists);
        });
    });
}

//Enter student information into database
function enterStudentInfo(idString, studentInfo){
    return new Promise((resolve, reject) => {
        var inserted = true;
        var message = "1 student record inserted";
        var sql = "INSERT INTO StudentInfo (TeacherUsername, IDNumber, FirstName, LastName, Gender, SchoolYear)" +
        " VALUES ('" + teacherObject.UserName + "', '" + idString + "', '" + studentInfo.FirstName + "', '" + studentInfo.LastName  + "', '" + studentInfo.Gender + "', '"  + studentInfo.SchoolYear + "');";
        con.query(sql, function (err, result) {
        if (err){ inserted = false;  message = "Record Was Not Inserted"; }
        console.log(message);
        resolve(inserted);
        });
    });
}

//Enter student grades into the database
function enterStudentGrades(idNumber, reportGrades){
    var sql = "INSERT INTO StudentGrades (StudentIDNumber, ClassCode, ClassName, Credit, Grade)" +
    " VALUES ('" + idNumber + "', '" + reportGrades.Code + "', '" + reportGrades.Name + "', '" + 
    reportGrades.Credit + "', '" + reportGrades.Grade + "');";
    con.query(sql, function (err, result) {
    if (err) throw err;
        console.log("1 record inserted");
    });
}

//Get Student By ID
function getStudentObjectByID(idString){
    return new Promise((resolve, reject) => {
        var sql = "Select * From StudentInfo Where IDNumber = '" + idString + "';";
        con.query(sql, function (err, result) {
        //console.log(result[0]);
        var student = result[0];
        if (err) throw err;
        if(typeof result[0] === 'undefined') 
        console.log("Searching Student Table");
        resolve(student);
        });
    });

//Get Student Grades By ID
    function getStudentGradesByID(idString){
        return new Promise((resolve, reject) => {
            var sql = "Select * From StudentInfo Where IDNumber = '" + idString + "';";
            con.query(sql, function (err, result) {
            //console.log(result[0]);
            var studentExists = true;
            if (err) throw err;
            if(typeof result[0] === 'undefined') studentExists = false;
            console.log("Searching Student Table");
            resolve(studentExists);
            });
        });
    }
}

    
    
  


