CREATE DATABASE IF NOT EXISTS TeacherDB;
use TeacherDB;

ALTER USER 'root'@'host.docker.internal' IDENTIFIED WITH mysql_native_password BY 'codingroot1!';
flush privileges;


create table StudentInfo(
TeacherUsername varchar(250),
IDNumber varchar(6) primary key,
FirstName varchar(250),
LastName varchar(250),
Gender varchar(6),
SchoolYear varchar(10)
);


create table StudentGrades(
StudentIDNumber varchar(7),
Grade1 varchar(2),
Grade2 varchar(2),
Grade3 varchar(2),
Grade4 varchar(2)
);
