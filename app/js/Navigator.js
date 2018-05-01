/**
 * JS ui router
 */
"use strict";

var Navigator = function( App ) {

    var scope = this;

    scope.appDiv = document.getElementById( "app" );

    scope.linkDiv = document.getElementById( "header-links" );


    /**
     * Methods
     */

    scope.route = function( method ) {

        method = method.split( "/" );
        method = method[ method.length - 1 ];

        if( method === "" ) {

            method = "splash";

        }

        console.log( method );

        App.UI.showPage( method );

        switch( method ) {

            case "create":
                break;

        }

    };


    /**
     * Set events
     */

    scope.linkDiv.onclick = function( e ) {

        if( e.target.tagName === "A" ) {

            scope.route( e.target.href );

        }

    };


    //Init route

    scope.route( window.location.href );

};
