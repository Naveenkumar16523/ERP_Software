def send_email(to_email: str, subject: str, body: str, attachment: bytes = None, attachment_name: str = None) -> bool:
    """
    Mock function to simulate sending an email.
    """
    import logging
    logging.info(f"EMAIL SENT TO: {to_email}")
    logging.info(f"SUBJECT: {subject}")
    if attachment:
        logging.info(f"ATTACHMENT: {attachment_name} ({len(attachment)} bytes)")
    return True

def send_whatsapp_sms(to_phone: str, message: str) -> bool:
    """
    Mock function to simulate sending a WhatsApp or SMS message.
    """
    import logging
    logging.info(f"WHATSAPP/SMS SENT TO: {to_phone}")
    logging.info(f"MESSAGE: {message}")
    return True
