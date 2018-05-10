/**
 * Contract calls API
 */
"use strict";

var Contract = function() {

    var scope = this;

    scope.loadedJingles = {};


    /**
     * Contract API
     */

    scope.getAccount = function( addr, callback ) {

        var test = {
            address: addr,
            name: "Test",
            jingles: [
                {
                    id: 1,
                    name: "Test Jingle"
                }
            ]
        };

        callback( test );

    };

    scope.getJingles = function( callback ) {

        var jingles = [ 1 ];

        async.eachSeries( jingles, function( item, itemCallback ) {

            scope.getJingle( item, function( jingle ) {

                itemCallback();

            });

        }, function() {

            callback( scope.loadedJingles );

        });

    };

    scope.getJingle = function( id, callback ) {

        if( scope.loadedJingles[ id ] ) {

            return callback( scope.loadedJingles[ id ] );

        }

        scope.loadedJingles[ id ] = {
            id: id,
            name: "Test Jingle",
            account: {
                address: "0xTEST",
                name: "Test",
            }
        };

        callback( scope.loadedJingles[ id ] );

    };


    /**
     * Main create jingle
     */

    scope.create = function( data, callback ) {
    };

};
