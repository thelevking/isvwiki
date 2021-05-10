//
// Interslavic input method
// Based on:
// - https://de.wikipedia.org/wiki/Benutzer:Jowereit/typografie.js
// - https://de.wikipedia.org/wiki/Benutzer:Schnark/js/veAutocorrect.js
// Preferences are below
//
if (typeof im === 'undefined') im = {};
im.menu = {
	title: 'Metoda vpisa',
	description: 'Koristajte skračeńja dlja vpisa razširenoj latinicy i kirilicy.',
	help: 'Pomoč',
	helpLink: '/wiki/Project:Pomoč/Metoda_vpisa',
	toggle: 'Vključiti'
};
im.enable = true; // Enable script
im.textbox = null; // Main form detection
im.veCommandCount = 0; // Counter for commands in VE
im.keys = {}; // Key codes
im.replace = {}; // Replacements
im.ignore = [ // IDs of fields that should not be controlled
	'wpUserEmail',
	'wpEmail',
	'mw-input-wpemailaddress',
	'wpCaptchaWord'
];

// In Internet Explorer, it is not so easy to find the position of the cursor.
// Following workaround comes from
// http://the-stickman.com/web-development/javascript/finding-selection-cursor-position-in-textarea-in-internet-explorer/
function ie_getSelection(element) {
	var range = document.selection.createRange(); // We'll use this as a 'dummy'
	var stored_range = range.duplicate(); // Select all text
	stored_range.moveToElementText(element); // Now move 'dummy' end point to end point of original range
	stored_range.setEndPoint('EndToEnd', range); // Now we can calculate start and end points

	// Set the "selectionStart" and "selectionEnd" properties of the textbox so that they can be accessed as in Firefox.
	element.selectionStart = stored_range.text.length - range.text.length;
	element.selectionEnd = element.selectionStart + range.text.length;
}

// Writes the current paragraph to the curLine property of the specified text field. (So should be curParagraph or something like that).
function getCurLine(textarea) {
	var start = textarea.value.slice(0, textarea.selectionStart).lastIndexOf('\n') + 1;
	var end = textarea.value.slice(textarea.selectionStart).indexOf('\n');

	if (end == -1) {
		textarea.curLine = textarea.value.slice(start);
	} else {
		textarea.curLine = textarea.value.slice(start, textarea.selectionStart + end);
	}

	textarea.curLineOffset = start;
}

// Set the cursor to the position "pos" in the "textarea" text field.
function setcursor(textarea, pos) {
	if (document.selection && document.selection.createRange) { // Internet Explorer
		var range = textarea.createTextRange();
		range.collapse(true);
		var lineBreaksNum = textarea.value.slice(0, textarea.selectionStart).split('\r').length - 1;
		range.moveStart('character', pos - lineBreaksNum);
		range.moveEnd('character', 0);
		range.select();
	} else {
		textarea.selectionStart = pos;
		textarea.selectionEnd = pos;
	}
}

// Returns last entry by length
function lastEntry(element, length) {
	return element.curLine.slice(element.selectionStart - length - element.curLineOffset, element.selectionStart - element.curLineOffset);
}

// Inserts the text "text" in the text field "element" and deletes "number of zeros" before the cursor
function insert(element, text, strip) {
	var selStart = element.selectionStart; // Select the beginning of the selection since it is changed in the next statement.
	var scrollPos = element.scrollTop;
	element.value = element.value.slice(0, element.selectionStart - strip) + text + element.value.slice(element.selectionEnd);
	setcursor(element, selStart - strip + text.length);
	element.scrollTop = scrollPos;
}

function charAt(element, position) {
	return element.value.charAt(position);
}

// Returns the last occurrence of the string "text" in the current paragraph of the text field "element" to the start position of the selection.
function lastOccurrence(element, text) {
	return element.curLine.slice(0, element.selectionStart - element.curLineOffset).lastIndexOf(text);
}

/*
 * Replacement functions
 */

// Back and forth replacement of one letter
function replaceLetter ( self, e, from, to ) {
	var length = ( from.length > 1 ? Math.abs(1 - from.length) : 0 );
	var lastEntry = self.lastEntry( length );
	var fromSubstring = from.substring( 0, from.length - 1 );
	if ( length > 0 && lastEntry.toLowerCase() !== fromSubstring.toLowerCase() ) {
		return;
	}
	
	var result = to.charAt(0) + to.slice(1);
	if ( ( from.length > 1 && lastEntry.toUpperCase() === lastEntry )
		|| from.toUpperCase() === from ) {
		result = to.charAt(0).toUpperCase() + to.slice(1);
	}

	self.insert( result, length );
	e.preventDefault();
}

// Back and forth replacement of multiple letters
function replaceMultipleLetters ( self, e, from, to, symbol ) {
	var obj = null;

	var lastEntry = self.lastEntry(1);
	var isUpperCase = ( lastEntry.toUpperCase() === lastEntry );
	if ( isUpperCase ) {
		lastEntry = lastEntry.toLowerCase();
	}

	var trail = '';
	if ( Object.keys( to ).indexOf( lastEntry ) > -1 ) {
		obj = to;
	} else if ( Object.keys( from ).indexOf( lastEntry ) > -1 ) {
		obj = from;
		trail = symbol;
	}

	if ( obj !== null ) {
		var result = ( isUpperCase ? obj[lastEntry].toUpperCase() + trail : obj[lastEntry] + trail );
		self.insert(result, 1);

		e.preventDefault();
	}
}

// RegEx replacement for Visual Editor
function ve_replace( from, to, strip, source ) {
	source = source || false;
	var name = 'im-' + im.veCommandCount; // Random name with prefix
	
	// Disable the command if required
	if ( !im.enable ) {
		if ( !source ) {
			ve.ui.sequenceRegistry.unregister(name);
		}
		if ( ve.ui.wikitextSequenceRegistry ) {
			ve.ui.wikitextSequenceRegistry.unregister(name);
		}

		im.veCommandCount++;
		return;
	};

	var seq;
	ve.ui.commandRegistry.register(
		// 1st true: annotate, 2nd true: collapse to end
		new ve.ui.Command(name, 'content', 'insert', { args: [ to, true, true ] } )
	);

	// Create and register a sequence
	seq = new ve.ui.Sequence(name, name, from, strip);
	if ( !source ) {
		ve.ui.sequenceRegistry.register(seq);
	}
	if ( ve.ui.wikitextSequenceRegistry ) {
		ve.ui.wikitextSequenceRegistry.register(seq);
	}

	im.veCommandCount++;
}

// Back and forth replacement of one letter for Visual Editor
function ve_replaceLetter( from, to, symbol, strip ) {
	var reSymbol = ( symbol ? '[' + symbol.toUpperCase() + symbol + ']$' : '$' );
	symbol = ( symbol ? symbol : '' );
	var ucCombo = new RegExp( from.toUpperCase() + reSymbol );
	var ucComboRevert = new RegExp( to.toUpperCase() + reSymbol );

	// dj to ď
	ve_replace( from + symbol, to, strip );
	ve_replace( ucCombo, to.toUpperCase(), strip );
	// ďj to dj
	ve_replace( to + symbol, from + symbol, strip );
	ve_replace( ucComboRevert, from.toUpperCase() + symbol, strip );
}

// This function is called by pressing a key (onkeydown) in the text field.
function autocorrect( e ) {
	if ( !im.enable ) return true;
	if ( !e.key ) return true;

	// If there is no function for this key, stop future actions
	if ( Object.keys( im.keys ).indexOf( e.key ) === -1 ) {
		return true;
	}
	var selStart = this.selectionStart;
	var selEnd = this.selectionEnd;
	getCurLine( this );

	im.keys[ e.key ]( this, e, false, selStart, selEnd );
}

function ve_autocorrect() {
	im.veCommandCount = 0;
	for ( var func in im.replace ) {
		im.replace[ func ]( null, null, true );
	}
}

/*
 * Replacements
 */

// Restore things before the replacements
im.replace.backspace = function( self, e, isVE ) {
	// Visual Editor
	if ( isVE ) return;

	// WikiEditor
	if ( !e.shiftKey ) return;
	var lastEntry = self.lastEntry( 1 );

	// Look into im.replace.unusedLetters
	if ( lastEntry === 'Ј' || lastEntry === 'ј' ) {
		e.preventDefault();
		self.insert( ( lastEntry === 'Ј' ? 'Й': 'й' ), 1 );
	}
	
	// Look into im.replace.iLetter
	if ( lastEntry === 'И' || lastEntry === 'и' ) {
		e.preventDefault();
		self.insert( ( lastEntry === 'И' ? 'І': 'і' ), 1 );
	}
}

// Print letters with caron instead of x
im.replace.caronLetters = function( self, e, isVE ) {
	// Extended Latin to Basic
	var from = {
		'č': 'c',
		'ě': 'e',
		'ĺ': 'l',
		'ń': 'n',
		'š': 's',
		'ž': 'z'
	}
	// Basic Latin to Extended
	var to = {
		'c': 'č',
		'e': 'ě',
		'l': 'ĺ',
		'n': 'ń',
		's': 'š',
		'z': 'ž'
	}

	// VisualEditor
	if ( isVE ) {
		for ( var key in to ) {
			ve_replaceLetter( key, to[key], 'x', 2 );
		}
		return;
	};

	// WikiEditor
	replaceMultipleLetters( self, e, from, to, 'x' );
}

// Print Є on Serbian/Macedonian keyboard
im.replace.dzheKeySupport = function( self, e, isVE ) {
	// Extended Cyrillic to Basic
	var from = {
		'є': 'е'
	}
	// Basic Cyrillic to Extended
	var to = {
		'е': 'є'
	}

	// VisualEditor
	if ( isVE ) {
		for ( var key in to ) {
			ve_replaceLetter( key, to[key], 'џ', 2 );
		}
		return;
	};

	// WikiEditor
	replaceMultipleLetters( self, e, from, to, 'џ' );
}

// Print Ы on Ukrainian keyboard and И otherwise
im.replace.iLetter = function( self, e, isVE ) {
	// Replacements
	var to = {
		'І': 'И',
		'і': 'и'
	}

	// VisualEditor
	if ( isVE ) {
		// І to И
		for ( var key in to ) {
			ve_replace( key, to[key], key.length );
		}

		// Ь І to Ы
		ve_replaceLetter( 'ь', 'ы', 'і', 2 );
		return;
	};

	// WikiEditor: Ь І to Ы
	replaceMultipleLetters( self, e, { 'ы': 'ь' }, { 'ь': 'ы' }, 'і' );

	// WikiEditor: І to И
	var lastEntry = self.lastEntry( 1 ).toLowerCase();
	if ( lastEntry === 'ь' || lastEntry === 'і' ) {
		return;
	}

	if ( to[ e.key ] ) {
		replaceLetter( self, e, e.key, to[ e.key ] );
		return;
	}
	console.log('im: key ' + e.key + ' has not returned a function.');
}

// Print soft letters instead of ь
im.replace.softLetters = function( self, e, isVE ) {
	// Extended Cyrillic to Basic
	var from = {
		'є': 'е',
		'љ': 'л',
		'њ': 'н'
	}
	// Basic Cyrillic to Extended
	var to = {
		'е': 'є',
		'л': 'љ',
		'н': 'њ'
	}

	// VisualEditor
	if ( isVE ) {
		for ( var key in to ) {
			ve_replaceLetter( key, to[ key ], 'ь', 2 );
		}
		return;
	};

	// WikiEditor
	replaceMultipleLetters( self, e, from, to, 'ь' );
}

// Replace unused letters by appropriate ones
im.replace.unusedLetters = function( self, e, isVE ) {
	// Replacements
	var to = {
		'Й': 'Ј',
		'й': 'ј'
	}

	// VisualEditor
	if ( isVE ) {
		for ( var key in to ) {
			ve_replace( key, to[ key ], key.length );
		}
		return;
	};

	if ( to[ e.key ] ) {
		replaceLetter( self, e, e.key, to[ e.key ] );
		return;
	}
	console.log('im: key ' + e.key + ' has not returned a function.');
}

/*
 * Key codes
 */

// Backspace
im.keys['Backspace'] = im.replace.backspace;

// X, x
im.keys['X'] = im.replace.caronLetters;
im.keys['x'] = im.replace.caronLetters;

// І, і
im.keys['І'] = im.replace.iLetter;
im.keys['і'] = im.replace.iLetter;

// Џ, џ
im.keys['Џ'] = im.replace.dzheKeySupport;
im.keys['џ'] = im.replace.dzheKeySupport;

// Й, й
im.keys['Й'] = im.replace.unusedLetters;
im.keys['й'] = im.replace.unusedLetters;

// Ь, ь
im.keys['Ь'] = im.replace.softLetters;
im.keys['ь'] = im.replace.softLetters;

/*
 * Initialisation
 */

// Toggle the script work
function initToggle(e) {
	if ( e.ctrlKey && !e.altKey && !e.shiftKey && ( e.which === 77 || e.which === 109 ) ) {
		e.preventDefault();
		toggleIm( true );
		return;
	}
}

function toggleIm( onCheckbox ) {
	if ( onCheckbox ) {
		$( '#im-toggle' ).prop( 'checked', !im.enable );
		im.enable = !im.enable;
	}
	
	// Disable or enable commands if Visual Editor was open
	if ( im.enable === false && im.veCommandCount === 0 ) return;
	ve_autocorrect();
}

// Add menu for disabling the script
function initMenu () {
	var isVector = ( mw.config.get( 'skin' ) === 'vector' );

	var $panel = $( '#p-tb' ).clone().attr( 'id', 'p-im' ).attr( 'aria-labelledby', 'p-im-label' );
	$panel.find( 'h3' ).attr( 'id', 'p-im-label' ).text( im.menu.title );
	var $body = $panel.find( 'div' );
	$body.empty();

	var $toggle = $( '<label>' ).attr( 'for', 'im-toggle' ).text( im.menu.toggle + ' [Ctrl+M]' );
	var $checkbox = $( '<input>' )
		.attr( 'type', 'checkbox' )
		.attr( 'id', 'im-toggle' )
		.prependTo( $toggle );
	$checkbox.change( function () {
		im.enable = this.checked;
		toggleIm( false );

		if ( im.textbox !== null ) {
			im.textbox.focus();
		}
	} );

	if ( im.enable ) {
		$checkbox.prop('checked', true);
	}

	var $help = $('<a>').attr( 'href', im.menu.helpLink ).text( im.menu.help );
	$body
		.append( $toggle )
		.append( $('<p>').text( im.menu.description ) )
		.append( $help )

	$('#p-tb').after( $panel );
}

// Find elements
function initElements () {
	var main = [
		'wpTextbox1',
		'wpText',
		'wpUploadDescription'
	];

	var els = document.querySelectorAll('input, textarea');
	for (var i = els.length - 1; i >= 0; i--) {
		var success = initField( els[i] );

		// Have one of main fields as main textbox
		if ( im.textbox === null && success && main.indexOf( els[i].id ) > -1 ) {
			im.textbox = els[i];
		}
	}
}

// Initialise events on a field
function initField ( el, future ) {
	// Do not react on nothing
	if ( !el ) return false;

	// Do not react on bad inputs
	if (
		im.ignore.indexOf( el.id ) > -1
		|| ( el.tagName !== 'TEXTAREA' && el.tagName !== 'INPUT' )
		|| el.type === 'submit'
	) return false;
	
	el.onkeydown = autocorrect;

	el.lastEntry = function(length) { return lastEntry(this, length); }
	el.insert = function(text, strip) { return insert(this, text, strip); }
	el.lastOccurrence = function(text) { return lastOccurrence(this, text); }
	el.charAt = function(position) { return charAt(this, position); }

	el.im = true;

	return true;
}

// Watch future fields
function initFuture (e) {
	var target = e.target || event.srcElement;
	var doc = target && target.ownerDocument;
	var wysiwyg =
		(doc.designMode && doc.designMode.toLowerCase() == "on") ||
		(target.contentEditable &&
		 target.contentEditable.toLowerCase() == "true");
	if ( wysiwyg ) return;

	// Prevent doing anything on existing fields
	if ( target.im === true ) return;

	initField( target );
}

// Initialise
im.init = function () {
	if ( !$('#p-im').length ) {
		initMenu();
	}
	initElements();

	// Toggle on Ctrl+M
	document.addEventListener( 'keydown', initToggle );
	
	// Add Visual Editor support
	var veDeps = [ 'ext.visualEditor.desktopArticleTarget.init' ];
	mw.loader.using( veDeps, function () {
		mw.libs.ve.addPlugin( ve_autocorrect );
	} );
	
	// Add veaction (edge cases in VE) / Flow support
	var isFlowBoard = mw.config.get( 'wgPageContentModel' ) === 'flow-board';
	if ( isFlowBoard || location.href.search( 'veaction' ) > 0 ) {
		veDeps.push( 'ext.visualEditor.core' );
		if ( isFlowBoard || mw.libs && mw.libs.ve && mw.libs.ve.isWikitextAvailable ) {
			veDeps.push( 'ext.visualEditor.mwwikitext' );
		}
		
		mw.loader.using( veDeps, ve_autocorrect );
	};

	// Watch future fields (not on CodeEditor, it bugs out)
	if ( !mw.config.get( 'wgCodeEditorCurrentLanguage' ) ) {
		document.addEventListener( 'keydown', initFuture );
	}
}

// Fire event as soon as possible
$( im.init );
