const fs = require('fs');
require('dotenv').config();

const interview = fs.readFileSync('./sample-interview.txt', 'utf-8');
// console.log('raw interview: ', interview);

const newlineSplitInterview = interview.split('\n');
// console.log('newline split interview: ', newlineSplitInterview);

const speakerIds = process.env.DEFAULT_SPEAKERS.split(',');

const interviewSegments = newlineSplitInterview.filter((segment) =>
  speakerIds.some((speaker) => segment.includes(speaker))
);
// console.log('interview segment', interviewSegments);
const interviewNestedBySpeaker = interviewSegments.reduce(
  (outArr, segment, segI) => {
    function findSpeakerInSegment(seg) {
      return speakerIds.find((speaker) => seg.includes(speaker));
    }
    const currentSpeaker = findSpeakerInSegment(segment);

    function cleanSpeakerFromSegment(segment) {
      const cleanedSegment = segment.replace(`${currentSpeaker}:`, '').trim();
      return cleanedSegment.length > 0 ? cleanedSegment : '...';
    }

    function pushNewSpeakerGrouping() {
      outArr.push({
        speaker: currentSpeaker,
        transcripts: [cleanSpeakerFromSegment(segment)],
      });
    }

    if (segI === 0) {
      pushNewSpeakerGrouping();
    } else {
      const previousSpeaker = findSpeakerInSegment(interviewSegments[segI - 1]);
      if (currentSpeaker === previousSpeaker) {
        outArr[outArr.length - 1].transcripts.push(
          cleanSpeakerFromSegment(segment)
        );
      } else {
        pushNewSpeakerGrouping();
      }
    }
    return outArr;
  },
  []
);

const joinedGroups = interviewNestedBySpeaker.map((segmentGroup) => {
  let section = `${segmentGroup.speaker}:
  ${segmentGroup.transcripts.join(' ')}`;
  const lastCharInSection = section[section.length - 1];
  if (
    lastCharInSection !== '.' ||
    lastCharInSection !== '?' ||
    lastCharInSection !== '!'
  ) {
    if (lastCharInSection === ',') {
      section = section.substring(0, section.length - 1);
    }
    section = section + '...';
  }
  return section;
});
// console.log('joined groups: ', joinedGroups);

fs.writeFileSync('parsed-interview.txt', joinedGroups.join('\n\n'));
