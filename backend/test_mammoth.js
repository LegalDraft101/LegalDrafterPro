const docx = require('mammoth');
const path = require('path');

async function test() {
    const p = path.join(__dirname, 'file_storage/affidavits/AFFIDAVIT - NAME DIFFERENCE.docx');
    console.log("Reading:", p);
    try {
        const result = await docx.extractRawText({ path: p });

        console.log("----- RAW TEXT TAIL -----");
        console.log(result.value.substring(result.value.length - 1000));
        console.log("----- RAW TEXT TAIL END -----");
    } catch (e) {
        console.error(e);
    }
}

test();
