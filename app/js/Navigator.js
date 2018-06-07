/**
 * JS ui router
 */
"use strict";

var Navigator = function( App ) {

    var scope = this;

    scope.appDiv = document.getElementById( "app" );

    scope.linkDiv = document.getElementById( "header-links" );

    scope.currentRoute;


    /**
     * Methods
     */

    scope.route = function( methodFull ) {

        scope.currentRoute = methodFull;

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

    };


    /**
     * Listener
     */

    scope.listen = function() {

        document.body.addEventListener( "click", function( e ) {

            if( e.target.tagName !== "A" ) { return; }

            var anchor = e.target;

            if( anchor.hostname !== window.location.hostname ) {

                return;

            }

            e.preventDefault();

            scope.route( anchor.href );

            window.history.pushState( "", "", anchor.href );

        }, false );

    };


    //Init route

    scope.route( window.location.href );

    scope.listen();


    //Account page fix
    //@TODO solidity func calls in Contract

    App.Contract.on( "load", function() {

        console.log( "TEST" );

        scope.route( scope.currentRoute );

    });

};

export { Navigator };
