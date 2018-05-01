/**
 * Main app
 */
"use strict";

var fs = require( "fs" );

var path = require( "path" );

var Express = require( "express" );
var app = Express();

var Config = require( "./Config.js" );


//Templater

var Templater = require( "./Templater.js" );


//Static files

app.use( "/js", Express.static( __dirname + "/../app/js" ) );
app.use( "/css", Express.static( __dirname + "/../app/css" ) );
app.use( "/node_modules", Express.static( __dirname + "/../app/node_modules" ) );


//Express setup


function indexPage() {

    return Templater.getTemplate( "index.html" );

}

app.get( "/", function( req, res ) {

    res.send( indexPage() );

});

app.get( "/explore", function( req, res ) {

    res.send( indexPage() );

});

app.get( "/accounts/{address}", function( req, res ) {

});

app.get( "/jingle/{id}", function( req, res ) {

});


//Main listener

app.listen( Config.getConfig().web_port, function() {

    console.log( "App listening on port " + Config.getConfig().web_port );

});
