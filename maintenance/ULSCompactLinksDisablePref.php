<?php
/**
 * Disables the UniversalLanguageSelector compact-language-links
 * preference for appropriate users
 *
 * @copyright 2017 Wikimedia Language team and others; see AUTHORS.txt
 * @license GPL-2.0+
 * @author Niklas Laxström
 * @author Amir E. Aharoni
 * Based on autodisablePref.php from the VisualEditor repository by Alex Monk
 * @file
 * @ingroup Extensions
 * @ingroup Maintenance
 */

require_once getenv( 'MW_INSTALL_PATH' ) !== false
	? getenv( 'MW_INSTALL_PATH' ) . '/maintenance/Maintenance.php'
	: __DIR__ . '/../../../maintenance/Maintenance.php';

class ULSCompactLinksDisablePref extends Maintenance {
	public function __construct() {
		parent::__construct();
		$this->requireExtension( 'UniversalLanguageSelector' );
		$this->mDescription = 'Disables the UniversalLanguageSelector compact-language-links ' .
			'preference for appropriate users.';
		$this->setBatchSize( 100 );

		$this->addOption( 'really', 'Really change the preferences' );
	}

	public function execute() {
		$dbr = wfGetDB( DB_REPLICA );

		$this->really = $this->hasOption( 'really' );

		$lastUserId = 0;
		do {
			$tables = [ 'revision', 'user_properties', 'user_groups' ];
			$fields = [ 'rev_user', 'isbot' => 'ug_group', 'hasbeta' => 'up_value' ];
			$conds = [
				'rev_timestamp > ' . $dbr->timestamp( 20170101000000 ),
				"rev_user > $lastUserId"
			];
			$options = [
				'GROUP BY' => 'rev_user',
				'HAVING' => 'count(*) >= 20',
				'ORDER BY' => 'rev_user',
				'LIMIT' => $this->mBatchSize,
			];
			$joins = [
				'user_properties' => [
					'LEFT OUTER JOIN',
					"rev_user = up_user AND up_property = 'uls-compact-links' AND up_value = 1"
				],
				'user_groups' => [
					'LEFT OUTER JOIN',
					"rev_user = ug_user AND ug_group = 'bot'"
				]
			];

			if ( !$this->really ) {
				echo "\n\n" .
					$dbr->selectSqlText( $tables, $fields, $conds, __METHOD__, $options, $joins ) .
					"\n";
			}

			$results = $dbr->select( $tables, $fields, $conds, __METHOD__, $options, $joins );

			$disabled = 0;

			foreach ( $results as $row ) {
				$lastUserId = $row->rev_user;
				if ( $row->isbot === 'bot' || $row->hasbeta !== null ) {
					continue;
				}

				$user = User::newFromId( $lastUserId );
				$user->load( User::READ_LATEST );

				if ( $this->really ) {
					$user->setOption( 'compact-language-links', 0 );

					$user->saveSettings();
				}

				$disabled++;
				// If we ever need to revert, print the affected user ids
				$this->output( $row->rev_user . " ", 'userids' );
			}

			$this->output( "Disabled compact-language-links for $disabled users.\n" );
			wfWaitForSlaves();
		} while ( $results->numRows() === $this->mBatchSize );

		$this->output( "done.\n" );
	}
}

$maintClass = "ULSCompactLinksDisablePref";
require_once RUN_MAINTENANCE_IF_MAIN;
