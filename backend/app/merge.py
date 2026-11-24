"""Merging two copies of the client progress object (the structure the app stores in localStorage).

Used only when two devices changed progress independently. Rules:
- answers log, exam history, saved sessions: union by timestamp/key;
- error list: union, minus items that were later answered correctly in "work on errors" mode;
- best exam: the better result; read marks and used-question marks: union;
- a progress reset (resetAt) wins over older data from the other copy.
"""
import json

LOG_CAP = 1500
HIST_CAP = 60


def _int(v) -> int:
    try:
        return int(v or 0)
    except (TypeError, ValueError):
        return 0


def _ts(e) -> int:
    return _int(e.get('ts')) if isinstance(e, dict) else 0


def _lst(d: dict, k: str) -> list:
    v = d.get(k)
    return [x for x in v if isinstance(x, dict)] if isinstance(v, list) else []


def _dct(d: dict, k: str) -> dict:
    v = d.get(k)
    return v if isinstance(v, dict) else {}


def merge_states(server: dict, client: dict) -> dict:
    server = server if isinstance(server, dict) else {}
    client = client if isinstance(client, dict) else {}
    rs, rc = _int(server.get('resetAt')), _int(client.get('resetAt'))
    reset = max(rs, rc)
    same = rs == rc
    newer, older = (client, server) if rc >= rs else (server, client)

    def from_older(items: list) -> list:
        return items if same else [e for e in items if _ts(e) >= reset]

    out = {**server, **client} if same else dict(newer)
    if reset:
        out['resetAt'] = reset

    # answers log
    seen, log = set(), []
    for e in sorted(_lst(newer, 'log') + from_older(_lst(older, 'log')), key=_ts):
        key = (_ts(e), str(e.get('k')), str(e.get('id')), str(e.get('m')), bool(e.get('ok')))
        if key not in seen:
            seen.add(key)
            log.append(e)
    out['log'] = log[-LOG_CAP:]

    # errors
    errs: dict[str, dict] = {}
    for e in _lst(newer, 'err') + from_older(_lst(older, 'err')):
        k = str(e.get('key', ''))
        if k and (k not in errs or _ts(e) > _ts(errs[k])):
            errs[k] = e
    cleared: dict[str, int] = {}
    for e in log:
        if e.get('ok') and e.get('m') == 'err':
            k = f"{e.get('k')}:{e.get('id')}"
            cleared[k] = max(cleared.get(k, 0), _ts(e))
    out['err'] = sorted((e for k, e in errs.items() if cleared.get(k, -1) < _ts(e)), key=_ts)

    # exam history (newer copy wins on equal ts: it carries later self-assessment)
    hist: dict[int, dict] = {}
    for e in from_older(_lst(older, 'hist')) + _lst(newer, 'hist'):
        hist[_ts(e)] = e
    out['hist'] = [hist[k] for k in sorted(hist)][-HIST_CAP:]

    # best result
    cands = [b for b in [newer.get('best')] + from_older([older.get('best')] if isinstance(older.get('best'), dict) else []) if isinstance(b, dict)]
    out['best'] = max(cands, key=lambda b: (_int(b.get('pct')), _ts(b))) if cands else None

    # read marks and used questions
    if same:
        read = dict(_dct(server, 'read'))
        for k, v in _dct(client, 'read').items():
            read[k] = bool(read.get(k)) or bool(v)
        out['read'] = read
        used = {k: dict(v) for k, v in _dct(server, 'used').items() if isinstance(v, dict)}
        for t, v in _dct(client, 'used').items():
            if isinstance(v, dict):
                used.setdefault(t, {}).update(v)
        out['used'] = used

    # unfinished sessions
    sv: dict[str, dict] = {}
    for e in _lst(newer, 'sv') + from_older(_lst(older, 'sv')):
        k = str(e.get('key', ''))
        if k and (k not in sv or _ts(e) > _ts(sv[k])):
            sv[k] = e
    out['sv'] = sorted(sv.values(), key=_ts)
    return out


def canon(d) -> str:
    return json.dumps(d, sort_keys=True, ensure_ascii=False, separators=(',', ':'))
