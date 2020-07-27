const webVTT = require('node-webvtt');
const fs = require('fs');

function paresAndWrite(fileName) {
  const inputString = fs.readFileSync(`input/${fileName}`, 'utf-8');

  const parsed = webVTT.parse(inputString);

  // console.log(parsed);

  const cues = parsed.cues;

  const segmentsBySpeaker = cues.reduce(
    (outArr, cue, cueI) => {
      function findSpeakerInCue(cue) {
        return cue.text.substring(0, cue.text.indexOf(': '));
      }
      const currentSpeaker = findSpeakerInCue(cue);

      function cleanSpeakerFromCue(cue) {
        const cleanedSegment = cue.text.replace(`${currentSpeaker}:`, '').trim();
        return cleanedSegment.length > 0 ? cleanedSegment : '...';
      }

      function pushNewSpeakerGrouping() {
        outArr.push({
          speaker: currentSpeaker,
          transcripts: [cleanSpeakerFromCue(cue)],
        });
      }

      if (cueI === 0) {
        pushNewSpeakerGrouping();
      } else {
        const previousSpeaker = outArr[outArr.length - 1].speaker;
        if (currentSpeaker === previousSpeaker) {
          outArr[outArr.length - 1].transcripts.push(
            cleanSpeakerFromCue(cue)
          );
        } else {
          pushNewSpeakerGrouping();
        }
      }
      return outArr;
    },
    []
  );

  // console.log('segments by speaker: ', segmentsBySpeaker);

  const joinedGroups = segmentsBySpeaker.map((segmentGroup) => {
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

  fs.writeFileSync(`output/${fileName.substring(0, fileName.indexOf('.vtt'))}.txt`, joinedGroups.join('\n\n'));
}

async function writeInputVTTToText() {
  const inputDir = await fs.promises.opendir('input');
  for await (const dirint of inputDir) {
    paresAndWrite(dirint.name);
  }
}

writeInputVTTToText();

