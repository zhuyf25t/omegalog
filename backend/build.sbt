ThisBuild / scalaVersion := "3.3.3"
ThisBuild / organization := "omegalog"
ThisBuild / version := "0.1.0-SNAPSHOT"

lazy val root = (project in file("."))
  .settings(
    name := "omegalog-backend",
    libraryDependencies += "org.typelevel" %% "cats-effect" % "3.5.7",
    scalacOptions ++= Seq("-deprecation", "-feature", "-unchecked")
  )
