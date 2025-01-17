<?php
header('Content-Type: application/json;charset=UTF-8');
header('Cache-Control: no-cache, must-revalidate');
require_once 'php/global_json.php';
require_once 'php/files.php';

if(!isset($_GET['id']))
	error('Missing data');

$study_id = (int) $_GET['id'];


$metadata_path = get_file_studyMetadata($study_id);
if(!file_exists($metadata_path))
	exit('Study does not exist');
$metadata = unserialize(file_get_contents($metadata_path));

if(sizeof($metadata['accessKeys']) && (!isset($_GET['access_key']) || !in_array(strtolower($_GET['access_key']), $metadata['accessKeys'])))
	error('Wrong accessKey');


$file_statistics_metadata = get_file_statisticsMetadata($study_id);
$file_statistics_newData = get_file_statisticsNewData($study_id);
$file_statistics_json = get_file_statisticsJson($study_id);
$file_statistics_newDataCopy = $file_statistics_newData .'_copy';

if(!file_exists($file_statistics_metadata))
	error('No statistics for this study');

$handle = fopen($file_statistics_json, 'r+');
if(!$handle)
	error('Internal server error');
flock($handle, LOCK_EX);
$statistics_jsonString = fread($handle, filesize($file_statistics_json));


if(file_exists($file_statistics_newData)) {
	function calcTimestamp($timestamp, $timeInterval) {
		return floor($timestamp / $timeInterval) * $timeInterval;
	}
	
	
	if(!rename($file_statistics_newData, $file_statistics_newDataCopy)) {//making sure that, while we are processing, no new data will be lost
		report("Could not rename \"$file_statistics_newData\" into \"$file_statistics_newDataCopy\" for study id $study_id. Processing new statistics is canceled!");
		flock($handle, LOCK_UN);
		fclose($handle);
		success($statistics_jsonString);
	}
	$newDataCollection = file($file_statistics_newDataCopy);
	$statistics_json = json_decode($statistics_jsonString);
	
	$newDataCollection_count = count($newDataCollection);
	if(count($newDataCollection) > STATISTICS_MAX_NEW_ENTRIES_AT_ONCE) {//there is too much data to process at once. We save the rest back again and process it next time
		report("Warning: The study with id $study_id had too much data for new statistics to process at once ($newDataCollection_count in total).\n\nIf this warning happens continuously, consider increasing STATISTICS_MAX_NEW_ENTRIES_AT_ONCE in php/configs.php");
		$handle2 = fopen($file_statistics_newData, 'a'); //this will create a new file because the original has already been renamed
		flock($handle2, LOCK_EX);
		
		for($i=STATISTICS_MAX_NEW_ENTRIES_AT_ONCE; $i<$newDataCollection_count; ++$i) {
			fwrite($handle2, $newDataCollection[$i]);
		}
		fflush($handle2);
		flock($handle2, LOCK_UN);
		fclose($handle2);
	}
	
	
	foreach($newDataCollection as $line) {
		$newData = explode('|', trim($line));
		$key = $newData[0];
		$index = $newData[1];
		$timestamp = $newData[2];
		$answer = $newData[3];
		$hasAnswer = $answer != '';
		
		if(!isset($statistics_json->{$key}[$index]))
			continue; //this should never happen!
		
		$current_json = &$statistics_json->{$key}[$index];
		
		$data = $current_json->data;
		
		switch($current_json->storageType) {
			case STATISTICS_STORAGE_TYPE_TIMED:
				$timeInterval = isset($current_json->timeInterval) ? $current_json->timeInterval : ONE_DAY;
				$answer_timestamp = calcTimestamp($timestamp/1000, $timeInterval);
				
				if(isset($data->{$answer_timestamp})) {
					$entry = $data->{$answer_timestamp};
					if($hasAnswer)
						$entry->sum += floatval($answer);
					++$entry->count;
				}
				else {
					++$current_json->entryCount;
					$data->{$answer_timestamp} = (object)[
						'sum' => $hasAnswer ? floatval($answer) : 0,
						'count' => 1
					];
					
					
					if($current_json->entryCount > STATISTICS_TIMED_STORAGE_MAX_ENTRIES && $current_json->timeInterval != ONE_DAY) {
						$timeInterval *= 2;
						if($timeInterval > ONE_DAY)
							$timeInterval = ONE_DAY;
						
						report("Warning: The statistics in the study with id $study_id has too much data saved for variable $key [$index]. timeInterval was increased to $timeInterval\n\nIf this warning happens continuously, consider increasing SMALLEST_TIMED_DISTANCE or STATISTICS_TIMED_STORAGE_MAX_ENTRIES in php/configs.php.");
						
						$current_json->timeInterval = $timeInterval;
						
						$save_metadata = true;

						$newData = new stdClass();
						$newEntryCount = 0;

						foreach($data as $key => $set) {
							$t = calcTimestamp($key, $timeInterval);
							if(isset($newData->{$t})) {
								$newData->{$t}->sum += $set->sum;
								$newData->{$t}->count += $set->count;
							}
							else {
								$newData->{$t} = $set;
								++$newEntryCount;
							}
						}
						$current_json->entryCount = $newEntryCount;
						$current_json->data = $newData;
					}
				}
				break;
			case STATISTICS_STORAGE_TYPE_FREQ_DISTR:
				if($hasAnswer) {
					if(isset($data->{$answer}))
						++$data->{$answer};
					else {
						$data->{$answer} = 1;
						++$current_json->entryCount;
					}
				}
				break;
		}
		
		
	}
	$output = json_encode($statistics_json);
	
	
	if(!unlink($file_statistics_newDataCopy)) {
		report("Could not remove \"$file_statistics_newDataCopy\" for study id $study_id! This will most likely lead to problems when we want to process the next batch for statistics.");
	}
	
	fseek($handle, 0);
	if(!ftruncate($handle, 0))
		report("Could not empty \"$file_statistics_json\" for study id $study_id! Statistics may have a syntax error now.");
	if(false === fwrite($handle, $output))
		report("Could not write \"$file_statistics_json\" for study id $study_id! Statistics are outdated now.");
	fflush($handle);
	flock($handle, LOCK_UN);
	fclose($handle);
	
	
	success($output);
}
else
	success($statistics_jsonString);

?>