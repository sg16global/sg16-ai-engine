/** Rule-based safety classifier — JS port of sg16-children-world/backend/sg16_safety.py */

export const Action = {
  ALLOW: 'ALLOW',
  SAFE_COMPLETE: 'SAFE_COMPLETE',
  REFUSE: 'REFUSE',
  CRISIS: 'CRISIS',
};

export const AgeTier = {
  KID: '6-11',
  TEEN: '12-17',
  ADULT: '18+',
};

const RE_EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const RE_PHONE = /(?:(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{4})/;
const RE_ADDRESS_HINT = /\b(address|street|st\.|road|rd\.|lane|ln\.|avenue|ave\.|zip|postal)\b/i;
const RE_PASSWORD_HINT = /\b(password|passcode|otp|2fa|verification code)\b/i;
const RE_SELF_HARM_CRISIS =
  /\b(i want to die|kill myself|suicide|end my life|i'm going to kill myself|i will kill myself|hurt myself tonight)\b/i;
const RE_SELF_HARM_GENERAL =
  /\b(self harm|cut myself|cutting|overdose|harm myself|want to disappear|not want to live)\b/i;
const RE_SEXUAL_EXPLICIT =
  /\b(porn|xxx|blowjob|handjob|anal sex|cum|ejaculate|masturbat(e|ion)|dildo|vibrator|fetish)\b/i;
const RE_SEXUAL_GENERAL = /\b(sex|sexual|nude|naked|hookup|kink|intercourse)\b/i;
const RE_WEAPON_MAKING =
  /\b(make (a )?(gun|bomb|pipe bomb|molotov)|build (a )?(gun|bomb)|homemade bomb|weapon blueprint)\b/i;
const RE_ILLEGAL_EVASION =
  /\b(how to hack|bypass|evade police|steal|shoplift|counterfeit|credit card fraud)\b/i;
const RE_GRAPHIC_VIOLENCE = /\b(gore|dismember|behead)\b/i;
const RE_HATE = /\b(kill all|exterminate)\b/i;
const RE_MEETUP =
  /\b(meet (me|up)|come over|my place|your place|send pics|snapchat|instagram dm)\b/i;
const RE_PROFANITY = /\b(fuck|shit|bitch)\b/i;

export function redactPii(text) {
  const flags = [];
  let redacted = text || '';

  if (RE_EMAIL.test(redacted)) {
    flags.push('PII_EMAIL');
    redacted = redacted.replace(RE_EMAIL, '[redacted email]');
  }

  const lower = redacted.toLowerCase();
  if (
    RE_PHONE.test(redacted) &&
    ['call', 'phone', 'number', 'whatsapp', 'text me'].some((k) => lower.includes(k))
  ) {
    flags.push('PII_PHONE');
    redacted = redacted.replace(RE_PHONE, '[redacted phone]');
  }

  if (RE_PASSWORD_HINT.test(redacted)) flags.push('PII_PASSWORD_HINT');
  if (RE_ADDRESS_HINT.test(redacted)) flags.push('PII_ADDRESS_HINT');

  return { redacted, flags };
}

export function classify(ageTier, text) {
  const flags = [];
  const { redacted, flags: piiFlags } = redactPii(text || '');
  flags.push(...piiFlags);

  const t = redacted;

  if (RE_SELF_HARM_CRISIS.test(t)) {
    flags.push('SELF_HARM_CRISIS');
    return { action: Action.CRISIS, flags, redactedText: redacted };
  }

  if (RE_SELF_HARM_GENERAL.test(t)) {
    flags.push('SELF_HARM');
    return { action: Action.SAFE_COMPLETE, flags, redactedText: redacted };
  }

  if (RE_SEXUAL_EXPLICIT.test(t)) {
    flags.push('SEXUAL_EXPLICIT');
    return { action: Action.REFUSE, flags, redactedText: redacted };
  }

  if (RE_SEXUAL_GENERAL.test(t)) {
    flags.push('SEXUAL');
    return { action: Action.SAFE_COMPLETE, flags, redactedText: redacted };
  }

  if (RE_WEAPON_MAKING.test(t)) {
    flags.push('WEAPON_MAKING');
    return { action: Action.REFUSE, flags, redactedText: redacted };
  }

  if (RE_ILLEGAL_EVASION.test(t)) {
    flags.push('ILLEGAL_WRONGDOING');
    return { action: Action.REFUSE, flags, redactedText: redacted };
  }

  if (RE_GRAPHIC_VIOLENCE.test(t)) {
    flags.push('GRAPHIC_VIOLENCE');
    return { action: Action.SAFE_COMPLETE, flags, redactedText: redacted };
  }

  if (RE_MEETUP.test(t)) {
    flags.push('MEETUP_OR_OFFPLATFORM');
    if (ageTier === AgeTier.KID || ageTier === AgeTier.TEEN) {
      return { action: Action.REFUSE, flags, redactedText: redacted };
    }
    return { action: Action.SAFE_COMPLETE, flags, redactedText: redacted };
  }

  if (RE_HATE.test(t)) {
    flags.push('HATE_OR_VIOLENCE');
    return { action: Action.REFUSE, flags, redactedText: redacted };
  }

  if (RE_PROFANITY.test(t)) {
    flags.push('PROFANITY');
    if (ageTier === AgeTier.KID) {
      return { action: Action.SAFE_COMPLETE, flags, redactedText: redacted };
    }
  }

  if (flags.some((f) => f.startsWith('PII_'))) {
    return { action: Action.SAFE_COMPLETE, flags, redactedText: redacted };
  }

  return { action: Action.ALLOW, flags, redactedText: redacted };
}

export function refusalMessage(ageTier, flags) {
  if (flags.includes('WEAPON_MAKING') || flags.includes('ILLEGAL_WRONGDOING')) {
    return "I can't help with that. I can help with safe and legal ideas instead. What are you trying to achieve (for example, a science project or safety info)?";
  }
  if (flags.includes('SEXUAL_EXPLICIT')) {
    return "I can't help with that. If you have a health or safety question, you can ask it in a general way.";
  }
  if (flags.includes('MEETUP_OR_OFFPLATFORM')) {
    if (ageTier === AgeTier.KID || ageTier === AgeTier.TEEN) {
      return "I can't help with meeting up or messaging privately. Please talk to a trusted grown-up if you need help.";
    }
    return "I can't help with moving chats off this app. If you want, tell me what you're trying to do and I'll give safe tips.";
  }
  if (flags.includes('HATE_OR_VIOLENCE')) {
    return "I can't help with hateful or harmful requests. I can help with respectful communication or conflict-solving instead.";
  }
  return "I can't help with that, but I can help with something safe. What would you like to do?";
}

export function crisisMessage(ageTier) {
  if (ageTier === AgeTier.KID) {
    return (
      "I'm really sorry you're feeling this way. You deserve help right now.\n" +
      'Please tell a trusted grown-up immediately (parent, guardian, teacher, or another safe adult).\n' +
      'If you are in danger or might hurt yourself, call your local emergency number right now.'
    );
  }
  return (
    "I'm really sorry you're going through this. You don't have to handle it alone.\n" +
    'Please reach out to someone you trust right now. If you feel in immediate danger, call your local emergency number.\n' +
    'If you can, consider contacting a local crisis hotline in your country.'
  );
}

export function applySafetyPipeline(ageTier, userText, modelReply = null) {
  const pre = classify(ageTier, userText);

  if (pre.action === Action.CRISIS) {
    return { action: pre.action, flags: pre.flags, reply: crisisMessage(ageTier) };
  }
  if (pre.action === Action.REFUSE) {
    return { action: pre.action, flags: pre.flags, reply: refusalMessage(ageTier, pre.flags) };
  }

  const result = {
    action: pre.action,
    flags: pre.flags,
    sanitizedUserText: pre.redactedText,
  };

  if (modelReply != null) {
    const post = classify(ageTier, modelReply);
    if (post.action === Action.REFUSE || post.action === Action.CRISIS) {
      result.postAction = post.action;
      result.postFlags = post.flags;
      result.reply =
        post.action === Action.REFUSE
          ? refusalMessage(ageTier, post.flags)
          : crisisMessage(ageTier);
    } else {
      result.postAction = post.action;
      result.postFlags = post.flags;
      result.reply = modelReply;
    }
  }

  return result;
}
