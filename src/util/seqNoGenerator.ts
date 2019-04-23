import { default as SequenceNumberModel, ISequenceNumber } from "../models/SequenceNumber";
import { Logger } from "./logger";

const logger = new Logger("util.seqNoGenerator");

type SequenceNoConfig = {
    seqKey: string;
    initialSeqNo: number;
};

export const SEQKEY_TRANSFER_FROM_SEQ = "transferFromSeq";
export const SEQKEY_TRANSFER_TO_SEQ = "transferToSeq";

const sequenceSet: SequenceNoConfig[] = [
    { seqKey: SEQKEY_TRANSFER_FROM_SEQ, initialSeqNo: 1000 },
    { seqKey: SEQKEY_TRANSFER_TO_SEQ, initialSeqNo: 2000 },
];

// Initialize seqNo for all pre-defined seqKeys during startup
function initSequenceSet() {
    logger.debug("calling initSequenceSet()");
    sequenceSet.forEach(async seqConfig => {
        let seqNoDoc = await SequenceNumberModel.findOne({ "seqKey": seqConfig.seqKey });
        if (!seqNoDoc) {
            seqNoDoc = new SequenceNumberModel({ seqKey: seqConfig.seqKey, seqNo: seqConfig.initialSeqNo });
            await seqNoDoc.save();
        }
    });
}

initSequenceSet();

export async function getNextSeqNo(seqKey: string, mongooseOpts: any, incStep?: number) {
    const incrementBy = incStep || 1;

    const updatedDoc = await SequenceNumberModel.findOneAndUpdate(
        { "seqKey": seqKey },
        { $inc: { seqNo: incrementBy } },
        { upsert: true, ...mongooseOpts } );

    return updatedDoc.seqNo;
}
