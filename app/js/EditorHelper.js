/**
 * Editor helper singleton
 */
"use strict";

import { Midi } from "./Midi.js"

var EditorHelper = new function() {

    var scope = this;

    scope.startingPitch = 100;
    scope.percision = 4; //Quarter note length


    /**
     * Props
     */

    scope.closeBtnClass = "close-btn";
    scope.closeNoteBtnClass = "close-note-btn";


    //Check random selector

    scope.checkRandom = function( input ) {

        if( input.value !== "random" ) {

            return;

        }

        var opts = input.options.length - 2;

        var index = Math.floor( ( Math.random() * opts ) + 2 );

        input.selectedIndex = index;

    }


    //Get args for contract

    scope.getArgs = function( beats ) {

        var midi = [];
        var startTimes = [];
        var durations = [];

        var bl = beats.length;

        var lastDivide = 0;

        var transposition = 0;

        var lastNotePitch = 0;
        var lastNote = 0;

        console.log( beats );

        for( var i = 0; i < bl; ++ i ) {

            var beat = beats[ i ];

            var nl = beat.notes.length;

            var length = Midi.LengthToPrecision[ beat.length ];

            //Rest
            if( nl === 0 ) {

                lastDivide += length;
                continue;

            }

            for( var t = 0; t < nl; ++ t ) {

                var note = beat.notes[ t ];

                if( transposition === 0 ) {

                    transposition = scope.startingPitch - note;

                }

                var noteInterval = transposition + note;

                midi.push( noteInterval );
                durations.push( length );
                startTimes.push( lastDivide );

            }

            lastDivide += length;

        }

        return {
            pitches: midi,
            startTimes: startTimes,
            durations: durations
        };

    }


    /**
     * Set inputs as required or not
     */

    scope.setRequired = function( area, required ) {

        var items = [];
        items = Array.prototype.concat.apply(items, area.getElementsByTagName("input"));
        items = Array.prototype.concat.apply(items, area.getElementsByTagName("select"));

        var il = items.length;

        for( var i = 0; i < il; ++ i ) {

            var item = items[ i ];

            required
                ? item.setAttribute( "required", true )
                : item.removeAttribute( "required" )

        }

    };


    /**
     * Remove parent
     */

    scope.removeNode = function( node ) {

        node.parentNode.removeChild( node );

    };

};

export { EditorHelper };
