/**
 * ULS Interface language selector
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

( function ( $, mw, window, document, undefined ) {
	'use strict';

	$( document ).ready( function () {
		var $ulsTrigger, $pLang,
			ulsOptions,
			previousLanguages, previousLang,
			rtlPage = $( 'body' ).hasClass( 'rtl' ),
			ulsPosition = mw.config.get( 'wgULSPosition' ),
			tipsyGravity = {
				personal: 'n',
				interlanguage: rtlPage ? 'e' : 'w'
			},
			currentLang = mw.config.get( 'wgUserLanguage' );

		if ( ulsPosition === 'interlanguage' ) {
			// The interlanguage links section
			$pLang = $( '#p-lang' );
			// Add an element near the interlanguage links header
			$pLang.prepend( $( '<span>' )
				.addClass( 'uls-trigger' )
				.attr( 'title', $.i18n( 'ext-uls-language-settings-title' ) )
			);
			// Remove the dummy link that was added to make sure that the section appears
			$pLang.find( '.uls-p-lang-dummy' ).remove();
		}

		$ulsTrigger = $( '.uls-trigger' );
		previousLanguages = mw.uls.getPreviousLanguages() || [];
		previousLang = previousLanguages.slice( -1 )[0];

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

		function addDisplaySettings( uls ) {
			var $displaySettings = displaySettings(),
				displaySettingsOptions = {
					defaultModule: 'display'
				};

			// If the ULS trigger is shown in the top personal menu,
			// closing the display settings must show the main ULS
			// languages list
			if ( ulsPosition === 'personal' ) {
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
			$ulsTrigger.attr( 'title', $.i18n( 'ext-uls-select-language-settings-icon-tooltip' ) );

			// This is a hook that runs in the ULS scope
			ulsOptions.onVisible = function () {
				var scrollPosition,
					$currentMenu,
					ulsHeight, ulsTop, ulsBottom,
					$languageSettingsTrigger = this.$menu.find( '#display-settings-block' ),
					padding = 10,
					$window = $( window ),
					windowHeight = $window.height(),
					windowScrollTop = $window.scrollTop(),
					windowBottom = windowScrollTop + windowHeight,
					ulsTriggerOffset = this.$element.offset();

				// Reposition the element -
				// the sidebar elements may have changed
				this.top = ulsTriggerOffset.top - 45;
				this.left = rtlPage ?
					ulsTriggerOffset.left - 22 - this.$menu.width() :
					ulsTriggerOffset.left + 50;
				this.$menu.css( this.position() );

				// Show the Display settings panel:
				// We are using the ULS trigger in the sidebar,
				// so we don't want to switch the language, but
				// to change the settings.
				$languageSettingsTrigger.click();

				$currentMenu = $( '.uls-menu:visible' );
				$currentMenu.css( this.position() );
				ulsHeight = $currentMenu.height();
				ulsTop = $currentMenu.offset().top;
				ulsBottom = ulsTop + ulsHeight;

				// If the ULS panel is out of the viewport,
				// scroll the window to show it
				if ( ( ulsTop < windowScrollTop ) || ( ulsBottom > windowBottom ) ) {
					if ( ulsHeight > windowHeight ) {
						// Scroll to show as much of the upper
						// part of ULS as possible
						scrollPosition = ulsTop - padding;
					} else {
						// Scroll just enough to show the ULS panel
						scrollPosition = ulsBottom - windowHeight + padding;
					}

					$( 'html, body' ).stop().animate( {
						scrollTop: scrollPosition
					}, 500 );
				}

				// Set the position of the caret according to the height
				// of the top row of the menu
				$currentMenu.find( '.caret-before, .caret-after' ).css( 'top',
					$currentMenu.find( '.row' ).height()
				);

			};
		}

		$ulsTrigger.uls( ulsOptions );

		if ( ulsPosition === 'interlanguage' ) {
			$( '.uls-menu' ).each( function () {
				$( this ).prepend(
					$( '<span>' ).addClass( 'caret-before' ),
					$( '<span>' ).addClass( 'caret-after' )
				);
			} );
		}

		if ( previousLang === currentLang  ) {
			// Do not show tooltip nor update language list
			return true;
		}

		previousLanguages.push( currentLang );
		mw.uls.setPreviousLanguages( previousLanguages );

		if ( !previousLang || !$.uls.data.languages[previousLang] ) {
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
	} );
}( jQuery, mediaWiki, window, document ) );
