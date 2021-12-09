
var mysql = require('mysql');

class projectdb{

    constructor(){
        
    }

dbconfig(){
    var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    port: 3306,
    password: "codingroot1!",
    db: "TeacherDB"
    });
    return con;
}


dbselect(){
    var con = this.dbconfig();
    con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
    con.query('Use TeacherDB;');
    var sql = "Select * From TeacherInfo;";
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log("Selecting From Teacher Table");
    });
  });
}


  enterTeacherInfo(teacherInfo){
    var con = this.dbconfig();
    con.connect(function(err, teacherInfo) {
        if (err) throw err;
        console.log("Connected!");
        var sql = "INSERT INTO TeacherInfo (FirstName, LastName, UserName, PassWord, Gender)" +
        " VALUES ('" + teacherInfo.firstName + "', '" + teacherInfo.lastName + "', '" + teacherInfo.userName + "', '" + teacherInfo.passWord + "', '" + teacherInfo.Gender + "');";
        con.query(sql, function (err, result) {
          if (err) throw err;
          console.log("1 record inserted");
        });
      });
  }
}
