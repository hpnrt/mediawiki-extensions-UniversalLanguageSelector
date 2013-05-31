/**
 * ULS interface integration logic
 *
 * Copyright (C) 2012-2013 Alolita Sharma, Amir Aharoni, Arun Ganesh, Brandon Harris,
 * Niklas Laxström, Pau Giner, Santhosh Thottingal, Siebrand Mazeland and other
 * contributors. See CREDITS for a list.
 *
 * UniversalLanguageSelector is dual licensed GPLv2 or later and MIT. You don't
 * have to do anything special to choose one license or the other and you don't
 * have to notify anyone which license you are using. You are free to use
 * UniversalLanguageSelector in commercial projects as long as the copyright
 * header is left intact. See files GPL-LICENSE and MIT-LICENSE for details.
 *
 * @file
 * @ingroup Extensions
 * @licence GNU General Public Licence 2.0 or later
 * @licence MIT License
 */

( function ( $, mw ) {
	'use strict';

	/*
	 * Construct the display settings link
	 */
	function displaySettings() {
		var $displaySettingsTitle, displaySettingsText, $displaySettings;

		displaySettingsText = $.i18n( 'ext-uls-display-settings-desc' );
		$displaySettingsTitle = $( '<div data-i18n="ext-uls-display-settings-title">' )
			.addClass( 'settings-title' )
			.attr( 'title', displaySettingsText );
		$displaySettings = $( '<div>' )
			.addClass( 'display-settings-block' )
			.prop( 'id', 'display-settings-block' )
			.append( $displaySettingsTitle );

		return $displaySettings;
	}

	/*
	 * Construct the input settings link
	 */
	function inputSettings() {
		var $inputSettingsTitle, inputSettingsText, $inputSettings;

		inputSettingsText = $.i18n( 'ext-uls-input-settings-desc' );
		$inputSettingsTitle = $( '<div data-i18n="ext-uls-input-settings-title">' )
			.addClass( 'settings-title' )
			.attr( 'title', inputSettingsText );
		$inputSettings = $( '<div>' )
			.addClass( 'input-settings-block' )
			.prop( 'id', 'input-settings-block' )
			.append( $inputSettingsTitle );

		return $inputSettings;
	}

	/*
	 * Add display settings link to the settings bar in ULS
	 * @param {Object} uls The ULS object
	 */
	function addDisplaySettings( uls ) {
		var $displaySettings = displaySettings(),
			ulsPosition = mw.config.get( 'wgULSPosition' ),
			anonMode = ( mw.user.isAnon() &&
				!mw.config.get( 'wgULSAnonCanChangeLanguage' ) ),
			displaySettingsOptions = {
				defaultModule: 'display'
			};

		// If the ULS trigger is shown in the top personal menu,
		// closing the display settings must show the main ULS
		// languages list, unless we are in anon mode and thus
		// cannot show the language list
		if ( ulsPosition === 'personal' && !anonMode ) {
			displaySettingsOptions.onClose = function () {
				uls.show();
			};
		}
		$.extend( displaySettingsOptions, uls.position() );

		uls.$menu.find( '#settings-block' ).append( $displaySettings );
		$displaySettings.languagesettings( displaySettingsOptions );
		$displaySettings.on( 'click', function () {
			uls.hide();
		} );
	}

	/*
	 * Add input settings link to the settings bar in ULS
	 * @param {Object} uls The ULS object
	 */
	function addInputSettings( uls ) {
		var $inputSettings, position;

		$inputSettings = inputSettings();
		uls.$menu.find( '#settings-block' ).append( $inputSettings );
		position = uls.position();

		$inputSettings.languagesettings( {
			defaultModule: 'input',
			onClose: function () {
				uls.show();
			},
			top: position.top,
			left: position.left
		} );

		$inputSettings.on( 'click', function () {
			uls.hide();
		} );
	}

	/*
	 * The tooltip to be shown when language changed using ULS
	 * It also allows to undo the language selection.
	 */
	function showULSTooltip() {
		var ulsPosition = mw.config.get( 'wgULSPosition' ),
			currentLang = mw.config.get( 'wgUserLanguage' ),
			previousLang,
			$ulsTrigger,
			anonMode,
			rtlPage = $( 'body' ).hasClass( 'rtl' ),
			tipsyGravity = {
				personal: 'n',
				interlanguage: rtlPage ? 'e' : 'w'
			},
			previousLanguages = mw.uls.getPreviousLanguages() || [];

		previousLang = previousLanguages.slice( -1 )[0];

		if ( previousLang === currentLang  ) {
			// Do not show tooltip nor update language list
			return true;
		}

		$ulsTrigger = ( ulsPosition === 'interlanguage' ) ?
			$( '.uls-settings-trigger' ) :
			$( '.uls-trigger' );

		previousLanguages.push( currentLang );
		mw.uls.setPreviousLanguages( previousLanguages );

		anonMode = ( mw.user.isAnon() &&
				!mw.config.get( 'wgULSAnonCanChangeLanguage' ) );

		if ( anonMode || !previousLang || !$.uls.data.languages[previousLang] ) {
			// Do not show tooltip
			return true;
		}

		// Attach a tipsy tooltip to the trigger
		$ulsTrigger.tipsy( {
			gravity: tipsyGravity[ulsPosition],
			delayOut: 3000,
			html: true,
			fade: true,
			trigger: 'manual',
			title: function () {
				var link;

				link = $( '<a>' ).text( $.uls.data.getAutonym( previousLang ) )
					.attr( {
						href: '#',
						'class': 'uls-prevlang-link',
						lang: previousLang,
						dir: $.uls.data.getDir( previousLang )
					} );

				// Get the html of the link by wrapping it in div first
				link = $( '<div>' ).html( link ).html();

				return $.i18n( 'ext-uls-undo-language-tooltip-text', link );
			}
		} );

		function showTipsy( timeout ) {
			var tipsyTimer = 0;

			$ulsTrigger.tipsy( 'show' );
			// if the mouse is over the tooltip, do not hide
			$( '.tipsy' ).on( 'mouseover', function () {
				window.clearTimeout( tipsyTimer );
			} );
			$( '.tipsy' ).on( 'mouseout', function () {
				tipsyTimer = window.setTimeout( function () {
					hideTipsy();
				}, timeout );
			} );
			// Event handler for links in the tooltip
			$( 'a.uls-prevlang-link' ).on( 'click', function () {
				mw.uls.changeLanguage( $( this ).attr( 'lang' ) );
			} );
			tipsyTimer = window.setTimeout( function () {
				hideTipsy();
			}, timeout );
		}

		function hideTipsy() {
			$ulsTrigger.tipsy( 'hide' );
		}

		// The interlanguage position needs some time to settle down
		window.setTimeout( function() {
			// Show the tipsy tooltip on page load.
			showTipsy( 6000 );
		}, 500 );

		// manually show the tooltip
		$ulsTrigger.on( 'mouseover', function () {
			// show only if the ULS panel is not shown
			if ( !$ulsTrigger.data( 'uls' ).shown ) {
				showTipsy( 3000 );
			}
		} );

		// hide the tooltip when clicked on uls trigger
		$ulsTrigger.on( 'click', function () {
			hideTipsy();
		} );
	}

	$( document ).ready( function () {
		var $ulsTrigger = $( '.uls-trigger' ),
			$ulsSettingsTrigger,
			$pLang,
			ulsOptions,
			rtlPage = $( 'body' ).hasClass( 'rtl' ),
			anonMode = ( mw.user.isAnon() &&
				!mw.config.get( 'wgULSAnonCanChangeLanguage' ) ),
			ulsPosition = mw.config.get( 'wgULSPosition' );

		if ( ulsPosition === 'interlanguage' ) {
			// The interlanguage links section
			$pLang = $( '#p-lang' );
			// Add an element near the interlanguage links header
			$ulsSettingsTrigger = $( '<span>' )
				.addClass( 'uls-settings-trigger' )
				.attr( 'title', $.i18n( 'ext-uls-language-settings-title' ) );
			$pLang.prepend( $ulsSettingsTrigger );

			// Remove the dummy link that was added to make sure that the section appears
			$pLang.find( '.uls-p-lang-dummy' ).remove();

			if ( !$pLang.find( 'div ul' ).children().length ) {
				// Replace the title of the interlanguage links
				// area if there are no interlanguage links
				$pLang.find( 'h3' )
					.text( mw.msg( 'uls-plang-title-languages' ) );

				// Remove the empty box that appears in the monobook skin
				if ( mw.config.get( 'skin' ) === 'monobook' ) {
					$pLang.find( 'div.pBody' ).remove();
				}
			}
		}

		// ULS options that are common to all modes of showing
		ulsOptions = {
			onReady: function () {
				if ( $.fn.languagesettings ) {
					addDisplaySettings( this );
					addInputSettings( this );
				}
			},
			onSelect: function ( language ) {
				mw.uls.changeLanguage( language );
			},
			languages: mw.config.get( 'wgULSLanguages' ),
			searchAPI: mw.util.wikiScript( 'api' ) + '?action=languagesearch',
			quickList: function () {
				return mw.uls.getFrequentLanguageList();
			}
		};

		if ( ulsPosition === 'interlanguage' ) {
			$ulsSettingsTrigger.attr( 'title', $.i18n( 'ext-uls-select-language-settings-icon-tooltip' ) );

			$ulsSettingsTrigger.languagesettings( {
				onVisible: function () {
					var left,
						ulsTriggerOffset = $ulsSettingsTrigger.offset();

					if ( rtlPage ) {
						left = ulsTriggerOffset.left - this.$window.width() - 30;
					} else {
						left = ulsTriggerOffset.left + 30;
					}

					this.left = left;
					this.top = ulsTriggerOffset.top - 50;
					this.position();
				}
			} );

			$( '.uls-menu' ).each( function () {
				$( this ).prepend(
					$( '<span>' ).addClass( 'caret-before' ),
					$( '<span>' ).addClass( 'caret-after' )
				);
			} );
		} else if ( anonMode ) {
			$ulsTrigger.languagesettings();
		} else {
			$ulsTrigger.uls( ulsOptions );
		}

		// Bind language settings to preferences page link
		$( '#uls-preferences-link' )
			.text( $.i18n( 'ext-uls-language-settings-preferences-link' ) )
			.click( function () {
				if ( $ulsTrigger.length ) {
					$ulsTrigger.click();
				} else {
					$( '.uls-settings-trigger' ).click();
				}
				return false;
			} );

		showULSTooltip();
	} );
}( jQuery, mediaWiki ) );
