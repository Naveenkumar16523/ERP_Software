import hashlib
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.models import JournalEntry

def calculate_block_hash(
    block_index: int,
    voucher_no: str,
    amount: float,
    debit_acc: str,
    credit_acc: str,
    prev_hash: str,
    date: datetime
) -> str:
    # Python datetimes must format to match JS's date.toISOString() (e.g. 2026-05-29T10:18:54.000Z)
    if not date:
        iso_date = ""
    else:
        # Check microseconds and format with exactly 3 decimal places
        formatted_date = date.strftime("%Y-%m-%dT%H:%M:%S")
        ms = int(date.microsecond / 1000)
        iso_date = f"{formatted_date}.{ms:03d}Z"
        
    data = f"{block_index}|{voucher_no}|{amount:.2f}|{debit_acc}|{credit_acc}|{prev_hash}|{iso_date}"
    return hashlib.sha256(data.encode('utf-8')).hexdigest()

def verify_ledger_chain(db: Session) -> dict:
    try:
        entries = db.query(JournalEntry).order_by(JournalEntry.blockIndex.asc()).all()
        if len(entries) == 0:
            return {"valid": True}

        # Verify first block
        first = entries[0]
        calculated_first = calculate_block_hash(
            first.blockIndex,
            first.voucherNo,
            first.amount,
            first.debitAcc,
            first.creditAcc,
            first.prevHash,
            first.date
        )

        if first.blockHash != calculated_first:
            return {
                "valid": False,
                "error": f"First block hash mismatch. Block index {first.blockIndex} was modified.",
                "compromisedBlockIndex": first.blockIndex
            }

        # Verify remaining blocks
        for i in range(1, len(entries)):
            current = entries[i]
            previous = entries[i - 1]

            if current.blockIndex != previous.blockIndex + 1:
                return {
                    "valid": False,
                    "error": f"Block index sequence broken at index {current.blockIndex}",
                    "compromisedBlockIndex": current.blockIndex
                }

            if current.prevHash != previous.blockHash:
                return {
                    "valid": False,
                    "error": f"Chain broken at block index {current.blockIndex}. Previous hash mismatch.",
                    "compromisedBlockIndex": current.blockIndex
                }

            calculated_current = calculate_block_hash(
                current.blockIndex,
                current.voucherNo,
                current.amount,
                current.debitAcc,
                current.creditAcc,
                current.prevHash,
                current.date
            )

            if current.blockHash != calculated_current:
                return {
                    "valid": False,
                    "error": f"Block hash mismatch at index {current.blockIndex}. Block was modified.",
                    "compromisedBlockIndex": current.blockIndex
                }

        return {"valid": True}
    except Exception as e:
        return {"valid": False, "error": str(e)}
