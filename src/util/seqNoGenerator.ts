import SequenceNumberModel from "../models/SequenceNumber";

// TODO: Initialize seqNo for all pre-defined seqKeys during startup


export async function getNextSeqNo(seqKey: string, mongooseOpts: any, incStep?: number) {
    const incrementBy = incStep || 1;

    const updatedDoc = await SequenceNumberModel.findOneAndUpdate(
        { "seqKey": seqKey },
        { $inc: { seqNo: incrementBy } },
        { upsert: true, ...mongooseOpts } );

    return updatedDoc.seqNo;
}
