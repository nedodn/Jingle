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

    scope.route = function( methodFull ) {

        var methodSplit = methodFull.split( "/" );
        var method = methodSplit[ methodSplit.length - 1 ];

        if( method === "" ) {

            method = "splash";

        }


        //Check if has arg like 0x or Jingle ID

        if( /\d/.exec( method[ 0 ] ) !== null ) {

            App.UI.showPage(
                methodSplit[ methodSplit.length - 2 ],
                methodSplit[ methodSplit.length - 1 ]
            );

        } else {

            App.UI.showPage( method );

        }


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

export { Navigator };
