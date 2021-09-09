create database TeacherDB;
use TeacherDB;

ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'codingroot1!';
flush privileges;

select * from TeacherInfo;

truncate table TeacherInfo;

create table StudentInfo(
TeacherUsername varchar(250),
IDNumber varchar(6) primary key,
FirstName varchar(250),
LastName varchar(250),
Gender varchar(6),
SchoolYear varchar(10)
);

select * from StudentInfo;
truncate table StudentInfo;

drop table StudentInfo;

create table StudentGrades(
StudentIDNumber varchar(7),
ClassCode varchar(10),
ClassName varchar(255),
Credit varchar(4),
Grade varchar(2)
);

select * from StudentGrades;