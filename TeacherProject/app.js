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
const port = 3006;
var alert = require('alert');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'pages'));


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
    Grade1: ' ',
    Grade2: ' ',
    Grade3: ' ',
    Grade4: ' '
};

var reportObject2 = {
    ClassCode: ' ',
    ClassName: ' ',
    Credit: ' ',
    Grade: ' '
};

var reportsArray = [reportObject2, reportObject2, reportObject2, reportObject2];

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
        reportsArray = newBlankArrayObject();
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
        studentObject.FirstName = '';
        studentObject.LastName = '';
        reportsArray = newBlankArrayObject();
        return res.render("addingStudent", {
            name: genderTitle(teacherObject) + teacherObject.LastName
        });
    }
    res.redirect("/");  
});

//Search database for student object and their associated grades
app.post("/SearchDatabase", function(req, res){
    if(typeof teacherObject.UserName !== 'undefined'){
        var s = req.body.searchedName;
        var t = teacherObject.UserName
        getStudentByTeachernID(s, t).then(function(student){
            if(typeof student !== 'undefined'){
                reportsArray = [];
                insertToStudentObject(student)
                getStudentGradesByID(student.IDNumber)
            }else{
                reportsArray = newBlankArrayObject();
                studentObject.FirstName = ' ';
                studentObject.LastName = ' ';
                alert("Student Could Not Be Found!");
            }
        });
        return res.redirect("/SearchStudentPage");
    }
    res.redirect("/");
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
        return res.render("searchStudentPage", {
            name: genderTitle(teacherObject) + teacherObject.LastName,
            grades: reportsArray,
            firstname: studentObject.FirstName,
            lastname: studentObject.LastName
        });
    }
    res.redirect("/");   
})

//Remove Student Page For Teachers
app.get("/RemoveStudentPage", function(req, res){
    if(typeof teacherObject.UserName !== 'undefined'){
        studentObject.FirstName = '';
        studentObject.LastName = '';
        reportsArray = newBlankArrayObject();
        return res.render("removeStudent", {
            name: genderTitle(teacherObject) + teacherObject.LastName
        });
    }
    res.redirect("/");  
});

//Used to verifying the information from register
app.post("/removeStudentFromDB", function(req, res){
    if(typeof teacherObject.UserName !== 'undefined'){
        var studentID = req.body.student.IDNumber;
        removeStudentByID(studentID).then(function(removed){
            if(removed){
                removeStudentGradesByID(studentID);
                alert('Student Was Removed');
            }else{
                alert('Student Could Not Be Found');
            }
        });
        return res.redirect("/RemoveStudentPage");
    }
    res.redirect("/");
});





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

function insertToReport(grade, index){
    reportObject2 = newBlankObject();
    reportObject2.ClassCode = classCodes[index];
    reportObject2.ClassName = classNames[index];
    reportObject2.Credit = classCredits[index]
    reportObject2.Grade = grade;
    return reportObject2;
}

function insertToReportArray(grades){
    var obj1 = insertToReport(grades.Grade1, 0);
    var obj2 = insertToReport(grades.Grade2, 1);
    var obj3 = insertToReport(grades.Grade3, 2);
    var obj4 = insertToReport(grades.Grade4, 3);
    reportsArray.push(obj1);
    reportsArray.push(obj2);
    reportsArray.push(obj3);
    reportsArray.push(obj4);
}

function newBlankObject(){
    var newObject = {
        ClassCode: ' ',
        ClassName: ' ',
        Credit: ' ',
        Grade: ' '
    };
    return newObject;
}

function newBlankArrayObject(){
    var blank = newBlankObject();
    var blankReport = [blank, blank, blank, blank];
    return blankReport;
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

function setClassGrade(){
    var rep = reportObject;
    rep.Grade1 = getCharacter();
    rep.Grade2 = getCharacter();
    rep.Grade3 = getCharacter();
    rep.Grade4 = getCharacter();
    return rep;
}

function saveRecord(idNumber){
    var reportCard = setClassGrade();
    enterStudentGrades(idNumber, reportCard);
}


//***************DATABASE METHODS********** */

//Create connection for database
var con = mysql.createConnection({
    host: "host.docker.internal",
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
        console.log("Selecting Student Table Using Teacher UserName");
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
    var sql = "INSERT INTO StudentGrades (StudentIDNumber, Grade1, Grade2, Grade3, Grade4)" +
    " VALUES ('" + idNumber + "', '" + reportGrades.Grade1 + "', '" + reportGrades.Grade2 + "', '" + 
    reportGrades.Grade3 + "', '" + reportGrades.Grade4 + "');";
    con.query(sql, function (err, result) {
    if (err) throw err;
        console.log("1 record inserted");
    });
}

//Get Student Grades By ID
    function getStudentGradesByID(idString){
        var sql = "Select * From StudentGrades Where StudentIDNumber = '" + idString + "';";
        con.query(sql, function (err, result) {
        if (err) throw err;
        if(typeof result !== 'undefined') insertToReportArray(result[0]);
        console.log("Searching Student Grade Table");
        });
    }

//Remove Student By ID
function removeStudentByID(idString){
    return new Promise((resolve, reject) => {
        var sql = "Delete From StudentInfo Where IDNumber = '" + idString + "';";
        con.query(sql, function (err, result) {
        console.log(result);
        var studentRemoved = true;
        if (err) throw err;
        if(result.affectedRows == 0) studentRemoved = false;
        console.log("Delete Student Table");
        resolve(studentRemoved);
        });
    });
}   

//Remove Student By ID
function removeStudentGradesByID(idString){
        var sql = "Delete From StudentGrades Where StudentIDNumber = '" + idString + "';";
        con.query(sql, function (err, result) {
        if (err) throw err;
    });
} 



    
    
  


