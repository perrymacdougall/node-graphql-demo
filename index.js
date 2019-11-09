const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const graphql = require('graphql');
const ExpressGraphQL = require('express-graphql');
const cors = require('cors');

const app = express();
app.use(cors());
const database = new sqlite3.Database('./my.db');

// Creating Contact table in SQLite3 db
const createContactTable = () => {
    const query = `
    CREATE TABLE IF NOT EXISTS contacts (
        id integer PRIMARY KEY,
        firstName text,
        lastName text,
        email text UNIQUE)`;
    return database.run(query);
}
createContactTable();

// Creating a custom GraphQL type that corresponds to a contact in the db
const ContactType = new graphql.GraphQLObjectType({
    name: "Contact",
    fields: {
        id: { type: graphql.GraphQLID },
        firstName: { type: graphql.GraphQLString },
        lastName: { type: graphql.GraphQLString },
        email: { type: graphql.GraphQLString }
    }
});

// Creating a custom GraphQL query for fetching data from the db
let queryType = new graphql.GraphQLObjectType({
    name: 'Query',
    fields: {
        contacts: {
            type: graphql.GraphQLList(ContactType),
            resolve: (root, args, context, info) => {
                return new Promise((resolve, reject) => {

                    database.all("SELECT * FROM contacts;", function (err, rows) {
                        if (err) {
                            reject([]);
                        }
                        resolve(rows);
                    });
                });
            }
        },
        contact: {
            type: ContactType,
            args: {
                id: {
                    type: new graphql.GraphQLNonNull(graphql.GraphQLID)
                }
            },
            resolve: (root, {
                id
            }, context, info) => {
                return new Promise((resolve, reject) => {

                    database.all("SELECT * FROM contacts WHERE id = (?);", [id], function(err, rows) {
                        if (err) {
                            reject(null);
                        }
                        resolve(rows[0]);
                    });
                });
            }
        }
    }
});

// Defining the basic CRUD operations for GraphQL
let mutationType = new graphql.GraphQLObjectType({
    name: 'Mutation',
    fields: {
        createContact: {
            type: ContactType,
            args: {
                firstName: {
                    type: new graphql.GraphQLNonNull(graphql.GraphQLString)
                },
                lastName: {
                    type: new graphql.GraphQLNonNull(graphql.GraphQLString)
                },
                email: {
                    type: new graphql.GraphQLNonNull(graphql.GraphQLString)
                }
            },
            resolve: (root, {
                firstName,
                lastName,
                email
            }) => {
                return new Promise((resolve, reject) => {
                    database.run('INSERT INTO contacts (firstName, lastName, email) VALUES (?,?,?);', [firstName, lastName, email], (err) => {
                        if (err) {
                            reject(null);
                        }
                        database.get('SELECT last_insert_rowid() as id', (err, row) => {

                            resolve({
                                id: row['id'],
                                firstName: firstName,
                                lastName: lastName,
                                email: email
                            });
                        });
                    });
                })
            }   
        },
        updateContact: {
            type: graphql.GraphQLString,
            args: {
                id: {
                    type: new graphql.GraphQLNonNull(graphql.GraphQLID)
                },
                firstName: {
                    type: new graphql.GraphQLNonNull(graphql.GraphQLString)
                },
                lastName: {
                    type: new graphql.GraphQLNonNull(graphql.GraphQLString)
                },
                email: {
                    type: new graphql.GraphQLNonNull(graphql.GraphQLString)
                },
            },
            resolve: (root, {
                id,
                firstName,
                lastName,
                email
            }) => {
                return new Promise((resolve, reject) => {
                    database.run('UPDATE contacts SET firstName = (?), lastname = (?), email = (?) WHERE id = (?);', [firstName, lastName, email, id], (err) => {
                        if (err) {
                            reject(err);
                        }
                        resolve(`Contact #${id} updated`);
                    });
                })
            }
        },
        deleteContact: {
            type: graphql.GraphQLString,
            args: {
                id: {
                    type: new graphql.GraphQLNonNull(graphql.GraphQLID)
                }
            },
            resolve: (root, {
                id
            }) => {
                return new Promise((resolve, reject) => {
                    database.run('DELETE from contacts WHERE id = (?);', [id], (err) => {
                        if (err) {
                            reject(err);
                        }
                        resolve(`Contact #${id} deleted`);
                    });
                })
            }
        }
    }
});

// Creating a schema for GraphQL
const schema = new graphql.GraphQLSchema({
    query: queryType,
    mutation: mutationType
});

// Mounting the GraphQL endpoint and running the Express server
app.use('/graphql', ExpressGraphQL({ schema: schema, graphiql: true}));
app.listen(4000, () => {
    console.log('GraphQL server running at http://localhost:4000.');
});