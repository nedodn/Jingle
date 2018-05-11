/**
 * Main app
 */
"use strict";

var fs = require( "fs" );

var path = require( "path" );

var Express = require( "express" );
var app = Express();

var Config = require( "./Config.js" );

var Midi = require( "./Midi.js" );


//Templater

var Templater = require( "./Templater.js" );


//Static files

app.use( "/js", Express.static( __dirname + "/../app/js" ) );
app.use( "/css", Express.static( __dirname + "/../app/css" ) );
app.use( "/node_modules", Express.static( __dirname + "/../app/node_modules" ) );
app.use( "/templates", Express.static( __dirname + "/../app/templates" ) );


//Express setup


function indexPage( req, res ) {

    var vars = {
        Midi: Midi
    };

    var content = Templater.getTemplate( "index.html", vars );

    res.send( content );

}

app.get( "/", indexPage );
app.get( "/explore", indexPage );
app.get( "/create", indexPage );
app.get( "/composers", indexPage );
app.get( "/profile", indexPage );


app.get( "/accounts/{address}", function( req, res ) {

});

app.get( /\/jingle\/\d*/, indexPage );


//Main listener

app.listen( Config.getConfig().web_port, function() {

    console.log( "App listening on port " + Config.getConfig().web_port );

});
