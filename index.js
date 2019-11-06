const express = require('express');
const sqlite = require('sqlite3').verbose();
const graphql = require('graphql');
const ExpressGraphQL = require('express-graphql');

const app = express();
const db = new sqlite3.Database('./my.db');