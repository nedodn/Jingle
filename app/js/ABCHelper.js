/**
 * ABC Helper for display
 */
"use strict";

import { Midi } from "./Midi.js"

import { Utils } from "./Utils/Utils.js"

var ABCHelper = new function() {

    var scope = this;

    scope.lastSharp = {};


    /**
     * Conversion to midi / sheet music plugins
     */

    scope.convertMidiToABC = function( midiNotes, length ) {

        var abc = scope.convertMidisToABCChord( midiNotes );

        var lengthABC = Midi.ABC.NoteLength[ length ];

        abc = abc + lengthABC;

        return abc;

    };

    scope.convertMidisToABCChord = function( midiNotes ) {

        var out = [];

        var ml = midiNotes.length;

        if( ml === 0 ) {

            return "z";

        }

        for( var i = 0; i < ml; ++ i ) {

            midiNotes[ i ] = midiNotes[ i ] | 0;

        }

        for( var i = 0; i < ml; ++ i ) {

            var note = midiNotes[ i ];

            var abc = scope.convertMidiToABCNote( note, midiNotes );

            out.push( abc );

        }

        return "[" + out.join( "" ) + "]";

    }

    scope.convertMidiToABCNote = function( midi, fromChord ) {

        var midiName = Midi.NoteNumber[ midi ];
        midiName = midiName.midi;

        var midiLetter = midiName.replace( /(\w)\#?(\d+)/, "\$1" );
        var midiNumber = midiName.replace( /.*?(\d+)/, "\$1" ) | 0;
        var sharp = midiName.indexOf( "#" ) !== -1;

        var abc = midiLetter;

        //Uppercase if over middle 4
        var lowerCase = midiNumber > 4;
        var appendage;

        if( lowerCase ) {

            abc = abc.toLowerCase();
            appendage = Utils.repeat( "'", midiNumber - 5 );

        } else {

            appendage = Utils.repeat( ",", Math.abs( midiNumber - 4 ) );

        }

        abc += appendage;

        if( sharp ) {

            abc = "^" + abc;

        } else {

            //Natural note explicit

            var nextMidiNum = midi + 1;
            var nextMidi = Midi.NoteNumber[ nextMidiNum ];

            //Check if played prior

            if( nextMidi ) {

                var nextMidiName = nextMidi.midi.replace( /(\w)\#?(\d+)/, "\$1" );

                if( nextMidiName === midiLetter && !! scope.lastSharp[ nextMidiNum ] ) {

                    scope.lastSharp[ nextMidiNum ] = false;
                    abc = "=" + abc;

                }

                //Check if sharp in chord

                else if ( fromChord.indexOf( nextMidi ) !== -1 ) {

                    abc = "=" + abc;

                }

            }

        }

        scope.lastSharp[ midi ] = true;

        return abc;

    };


    /**
     * Convert array to ABC
     */

    scope.convertArrayToABC = function( arr ) {

        var al = arr.length;

        var output = "";

        for( var i = 0; i < al; ++ i ) {

            var beat = arr[ i ];

            output += scope.convertMidiToABC( beat.notes, beat.length );

        }

        return output;

    };

};

export { ABCHelper };
