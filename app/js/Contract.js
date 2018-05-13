/**
 * Contract calls API
 */
"use strict";

import { default as async } from "async";
import { default as contract } from "truffle-contract";

import jingle_artifacts from '../../build/contracts/Jingle.json';

var Contract = function() {

    var scope = this;

    var JingleContract = contract( jingle_artifacts );

    JingleContract.setProvider(web3.currentProvider);

    scope.loadedJingles = {};


    /**
     * Contract API
     */

    scope.getAccount = function( addr, callback ) {

        JingleContract.deployed().then((jingleInstance) => {

            jingleInstance.tokensOf.call( addr ).then((jingles) => {
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
        });
    };

    scope.getJingles = function( callback ) {


        JingleContract.deployed().then((jingleInstance) => {

            jingleInstance.totalSupply.call().then((total) => {
                
                var jingles = Utils.createRange( 1, total );

                async.eachSeries( jingles, function( item, itemCallback ) {

                    scope.getJingle( item, function( jingle ) {

                        itemCallback();

                    });

                }, function() {

                    callback( scope.loadedJingles );

                });
                
            }) 

        });

    };

    scope.getJingle = function( id, callback ) {

        if( scope.loadedJingles[ id ] ) {

            return callback( scope.loadedJingles[ id ] );

        }

        JingleContract.deployed().then((jingleInstance) => {


            jingleInstance.getMelody.call( id ).then((data) => {

                if( err ) {

                    throw err;

                }

                jingleInstance.ownerOf.call( id ).then((account) => { 

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
        });

    };


    /**
     * Main create jingle
     */

    scope.create = function( data, callback ) {

        var trans = {
            value: COMPOSITION_PRICE
        };

        JingleContract.deployed().then((jingleInstance) => {

            jingleInstance.composeBaseMelody(
                data.pitches,
                data.startTimes,
                data.durations,
                data.price,
                trans,
            ).then((result) => {

                callback( result );

            });
        });

    };

};

export { Contract };
