/**
 * Contract calls API
 */
"use strict";

import { default as TruffleContract } from "truffle-contract"

import jingle_artifacts from '../../build/contracts/Jingle.json'

var Contract = function() {

    var scope = this;

    var JingleToken = TruffleContract( jingle_artifacts );

    scope.loadedJingles = {};


    /**
     * Contract API
     */

    scope.getAccount = function( addr, callback ) {

        JingleToken.tokensOf( addr, function( err, jingles ) {

            var cleanJingles = [];

            async.eachSeries( jingles, function( item, itemCallback ) {

                scope.getJingle( item.toNumber(), function( jingle ) {

                    cleanJingles.push( jingle );

                    itemCallback();

                });

            }, function() {

                var account = {
                    address: addr,
                    name: "Not Implemented",
                    jingles: cleanJingles
                };

                callback( account );

            });

        });

    };

    scope.getJingles = function( callback ) {

        JingleToken.totalSupply( function( err, total ) {

            var jingles = Utils.createRange( 1, total );

            async.eachSeries( jingles, function( item, itemCallback ) {

                scope.getJingle( item, function( jingle ) {

                    itemCallback();

                });

            }, function() {

                callback( scope.loadedJingles );

            });

        });

    };

    scope.getJingle = function( id, callback ) {

        if( scope.loadedJingles[ id ] ) {

            return callback( scope.loadedJingles[ id ] );

        }

        JingleToken.getMelody( id, function( err, data ) {

            if( err ) {

                throw err;

            }

            JingleToken.ownerOf( id, function( err, account ) {

                var jingle = {
                    id: id,
                    pitches: data[ 0 ],
                    startTimes: data[ 1 ],
                    durations: data[ 2 ],
                    account: {
                        address: account
                    }
                };

                scope.loadedJingles[ id ] = jingle

                callback( scope.loadedJingles[ id ] );

            });

        });

    };


    /**
     * Main create jingle
     */

    scope.create = function( data, callback ) {

        var trans = {
            value: COMPOSITION_PRICE
        };

        JingleToken.composeBaseMelody(
            data.pitches,
            data.startTimes,
            data.durations,
            data.price,
            trans,
            function( err, result ) {

                if( err ) {

                    throw err;

                }

                callback( result );

            }
        );

    };

};

export { Contract };
