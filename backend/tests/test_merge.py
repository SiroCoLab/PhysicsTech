from app.merge import merge_states


def L(ts, ok=1, k='q', id_=1, m='quiz', t='kin'):
    return {'k': k, 'id': id_, 't': t, 'ok': ok, 'c': '', 'm': m, 'ts': ts}


def test_log_union_sorted_and_deduplicated():
    a = {'log': [L(1), L(3)]}
    b = {'log': [L(2), L(3)]}
    out = merge_states(a, b)
    assert [e['ts'] for e in out['log']] == [1, 2, 3]


def test_log_cap():
    a = {'log': [L(i) for i in range(1000)]}
    b = {'log': [L(i) for i in range(1000, 2000)]}
    out = merge_states(a, b)
    assert len(out['log']) == 1500 and out['log'][-1]['ts'] == 1999


def test_errors_union_and_cleared_by_later_correct_answer_in_error_mode():
    server = {'err': [{'key': 'q:1', 'ts': 10}, {'key': 'q:2', 'ts': 10}], 'log': []}
    client = {'err': [{'key': 'g:atw', 'ts': 20}], 'log': [L(30, ok=1, id_=1, m='err')]}
    out = merge_states(server, client)
    assert sorted(e['key'] for e in out['err']) == ['g:atw', 'q:2']


def test_error_kept_if_wrong_again_after_clearing():
    server = {'err': [{'key': 'q:1', 'ts': 50}]}
    client = {'log': [L(30, ok=1, id_=1, m='err')]}
    out = merge_states(server, client)
    assert [e['key'] for e in out['err']] == ['q:1']


def test_correct_answer_outside_error_mode_does_not_clear():
    out = merge_states({'err': [{'key': 'q:1', 'ts': 10}]}, {'log': [L(30, ok=1, id_=1, m='quiz')]})
    assert len(out['err']) == 1


def test_best_hist_read_used_sv():
    server = {'best': {'pct': 60, 'ts': 1}, 'hist': [{'ts': 1, 'pct': 60}], 'read': {'kin': True, 'rot': False},
              'used': {'kin': {'q1': 1}}, 'sv': [{'key': 'exam', 'ts': 5, 'type': 'exam'}]}
    client = {'best': {'pct': 80, 'ts': 2}, 'hist': [{'ts': 2, 'pct': 80}, {'ts': 1, 'pct': 60, 'self': 1}], 'read': {'rot': True},
              'used': {'kin': {'q2': 1}, 'dyn': {'q9': 1}}, 'sv': [{'key': 'exam', 'ts': 9, 'type': 'exam', 'new': 1}]}
    out = merge_states(server, client)
    assert out['best']['pct'] == 80
    assert [h['ts'] for h in out['hist']] == [1, 2] and out['hist'][0].get('self') == 1
    assert out['read'] == {'kin': True, 'rot': True}
    assert out['used'] == {'kin': {'q1': 1, 'q2': 1}, 'dyn': {'q9': 1}}
    assert out['sv'] == [{'key': 'exam', 'ts': 9, 'type': 'exam', 'new': 1}]


def test_reset_on_client_drops_older_server_data():
    server = {'log': [L(10), L(100)], 'read': {'kin': True}, 'best': {'pct': 90, 'ts': 10}, 'hist': [{'ts': 10}]}
    client = {'resetAt': 50, 'log': [L(60)], 'read': {}}
    out = merge_states(server, client)
    assert [e['ts'] for e in out['log']] == [60, 100]
    assert out['read'] == {} and out['best'] is None and out['hist'] == [] and out['resetAt'] == 50


def test_reset_on_server_wins_over_old_client_data():
    server = {'resetAt': 50, 'log': [L(60)]}
    client = {'log': [L(10), L(70)], 'read': {'kin': True}}
    out = merge_states(server, client)
    assert [e['ts'] for e in out['log']] == [60, 70] and 'kin' not in out.get('read', {})


def test_unknown_fields_and_garbage_are_tolerated():
    out = merge_states({'log': 'bad', 'x': 1}, {'log': [None, 5, L(1)], 'formulaLab': {'idx': 2}, 'v': 1})
    assert out['log'] == [L(1)] and out['formulaLab'] == {'idx': 2} and out['x'] == 1


def test_merge_with_empty_client_returns_server_progress():
    server = {'log': [L(1)], 'err': [], 'best': None, 'hist': [], 'read': {'kin': True}, 'sv': [], 'used': {}, 'v': 1}
    out = merge_states(server, {'log': [], 'err': [], 'best': None, 'hist': [], 'read': {}, 'sv': [], 'used': {}, 'v': 1})
    assert out['log'] == server['log'] and out['read'] == {'kin': True}
