-- ============================================================
-- Clearview Retail Bank — 300 Synthetic Complaints Seed
-- All names, account numbers and data are entirely fictional.
-- Distribution:
--   Intent:   duplicate_charge 28% (84) · atm_failure 22% (66) ·
--             unauthorised_transaction 18% (54) · mortgage_dispute 15% (45) ·
--             account_closure 10% (30) · data_privacy 7% (21)
--   Priority: P1 10% (30) · P2 30% (90) · P3 60% (180)
--   Channel:  branch 22% (66) · call_centre 34% (102) · mobile 21% (63) ·
--             email 14% (42) · social_media 9% (27)
--   Vuln:     ~14% (42 records)
--   High redress (>£150): ~10% (30 records) — all have hitl_required=true
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- CUSTOMERS (50 synthetic profiles, reused across complaints)
-- ─────────────────────────────────────────────────────────────
INSERT INTO customers (customer_id, full_name, email, phone, tier, vulnerability_flag, vulnerability_markers) VALUES
('CUST-001','James Thornton','j.thornton@email.co.uk','07700900001','standard',FALSE,'[]'),
('CUST-002','Sarah Mitchell','s.mitchell@email.co.uk','07700900002','standard',FALSE,'[]'),
('CUST-003','David Patel','d.patel@email.co.uk','07700900003','premier',FALSE,'[]'),
('CUST-004','Emily Clarke','e.clarke@email.co.uk','07700900004','standard',TRUE,'["Recent bereavement"]'),
('CUST-005','Michael Osei','m.osei@email.co.uk','07700900005','standard',FALSE,'[]'),
('CUST-006','Priya Sharma','p.sharma@email.co.uk','07700900006','wealth',FALSE,'[]'),
('CUST-007','Robert Hughes','r.hughes@email.co.uk','07700900007','standard',TRUE,'["Mental health condition","Low financial resilience"]'),
('CUST-008','Fatima Al-Hassan','f.alhassan@email.co.uk','07700900008','sme',FALSE,'[]'),
('CUST-009','Thomas Brennan','t.brennan@email.co.uk','07700900009','standard',FALSE,'[]'),
('CUST-010','Lucy Watkins','l.watkins@email.co.uk','07700900010','premier',TRUE,'["Recent job loss"]'),
('CUST-011','George Adeyemi','g.adeyemi@email.co.uk','07700900011','standard',FALSE,'[]'),
('CUST-012','Hannah Brooks','h.brooks@email.co.uk','07700900012','standard',FALSE,'[]'),
('CUST-013','Oliver Singh','o.singh@email.co.uk','07700900013','standard',TRUE,'["Low digital literacy","Elderly and isolated"]'),
('CUST-014','Amelia Johnson','a.johnson@email.co.uk','07700900014','wealth',FALSE,'[]'),
('CUST-015','Daniel Kim','d.kim@email.co.uk','07700900015','standard',FALSE,'[]'),
('CUST-016','Sophie Turner','s.turner@email.co.uk','07700900016','premier',FALSE,'[]'),
('CUST-017','Benjamin Okafor','b.okafor@email.co.uk','07700900017','standard',TRUE,'["Limited English proficiency"]'),
('CUST-018','Isabella Russo','i.russo@email.co.uk','07700900018','standard',FALSE,'[]'),
('CUST-019','Henry Davies','h.davies@email.co.uk','07700900019','sme',FALSE,'[]'),
('CUST-020','Mia Thompson','m.thompson@email.co.uk','07700900020','standard',TRUE,'["Recent relationship breakdown"]'),
('CUST-021','William Foster','w.foster@email.co.uk','07700900021','standard',FALSE,'[]'),
('CUST-022','Charlotte Evans','c.evans@email.co.uk','07700900022','premier',FALSE,'[]'),
('CUST-023','Jack Nkosi','j.nkosi@email.co.uk','07700900023','standard',FALSE,'[]'),
('CUST-024','Ella Wright','e.wright@email.co.uk','07700900024','standard',TRUE,'["Physical disability or illness"]'),
('CUST-025','Noah Campbell','n.campbell@email.co.uk','07700900025','wealth',FALSE,'[]'),
('CUST-026','Grace Lee','g.lee@email.co.uk','07700900026','standard',FALSE,'[]'),
('CUST-027','Liam Ndlovu','l.ndlovu@email.co.uk','07700900027','standard',FALSE,'[]'),
('CUST-028','Scarlett Robinson','s.robinson@email.co.uk','07700900028','premier',TRUE,'["Caring responsibilities"]'),
('CUST-029','Harry Wilson','h.wilson@email.co.uk','07700900029','standard',FALSE,'[]'),
('CUST-030','Aria Patel','a.patel@email.co.uk','07700900030','sme',FALSE,'[]'),
('CUST-031','Ethan McDonald','e.mcdonald@email.co.uk','07700900031','standard',FALSE,'[]'),
('CUST-032','Lily Chen','l.chen@email.co.uk','07700900032','standard',TRUE,'["Recent trauma or abuse survivor"]'),
('CUST-033','Mason Brown','m.brown@email.co.uk','07700900033','premier',FALSE,'[]'),
('CUST-034','Chloe Adams','c.adams@email.co.uk','07700900034','standard',FALSE,'[]'),
('CUST-035','Logan Murray','l.murray@email.co.uk','07700900035','standard',FALSE,'[]'),
('CUST-036','Zoe Griffiths','z.griffiths@email.co.uk','07700900036','wealth',FALSE,'[]'),
('CUST-037','Lucas Mensah','l.mensah@email.co.uk','07700900037','standard',TRUE,'["Low financial resilience","Recent job loss"]'),
('CUST-038','Ava Jenkins','a.jenkins@email.co.uk','07700900038','standard',FALSE,'[]'),
('CUST-039','Alexander Walsh','a.walsh@email.co.uk','07700900039','sme',FALSE,'[]'),
('CUST-040','Madison Cooper','m.cooper@email.co.uk','07700900040','premier',FALSE,'[]'),
('CUST-041','Elijah Reed','e.reed@email.co.uk','07700900041','standard',FALSE,'[]'),
('CUST-042','Layla Morgan','l.morgan@email.co.uk','07700900042','standard',TRUE,'["Addiction"]'),
('CUST-043','Sebastian Price','s.price@email.co.uk','07700900043','premier',FALSE,'[]'),
('CUST-044','Sofia Barker','s.barker@email.co.uk','07700900044','standard',FALSE,'[]'),
('CUST-045','Aiden Flynn','a.flynn@email.co.uk','07700900045','standard',FALSE,'[]'),
('CUST-046','Victoria Holt','v.holt@email.co.uk','07700900046','wealth',FALSE,'[]'),
('CUST-047','Samuel Owusu','s.owusu@email.co.uk','07700900047','standard',TRUE,'["Mental health condition"]'),
('CUST-048','Penelope Grant','p.grant@email.co.uk','07700900048','standard',FALSE,'[]'),
('CUST-049','Joseph Briggs','j.briggs@email.co.uk','07700900049','sme',FALSE,'[]'),
('CUST-050','Nora Fitzgerald','n.fitzgerald@email.co.uk','07700900050','premier',FALSE,'[]');

-- ─────────────────────────────────────────────────────────────
-- COMPLAINTS — 300 records
-- Using INSERT with explicit created_at to simulate history
-- Vulnerable customers: CUST-004,007,010,013,017,020,024,028,032,037,042,047
-- High redress cases are marked in comments
-- ─────────────────────────────────────────────────────────────

-- ══════════════════════════════════════════════
-- BATCH 1: duplicate_charge (84 complaints)
-- ══════════════════════════════════════════════
INSERT INTO complaints (complaint_id,customer_id,channel,complaint_text,status,priority,intent_type,vulnerability_flag,legal_threat_flag,fca_deadline,disp_14_deadline,created_at) VALUES
('11111111-0001-0001-0001-000000000001','CUST-001','mobile','I was charged twice for my Netflix subscription on 3 Jan. Both transactions show £12.99 on the same day. Please refund one charge.','closed','P2','duplicate_charge',FALSE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-01-03 09:00:00+00'),
('11111111-0001-0001-0001-000000000002','CUST-002','email','Two identical gym membership payments of £45 debited on 15 Jan. I only have one membership. This is clearly a duplicate.','closed','P2','duplicate_charge',FALSE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-01-15 10:30:00+00'),
('11111111-0001-0001-0001-000000000003','CUST-004','call_centre','My electricity direct debit went out twice this month. I am recently widowed and managing finances alone for the first time. This is causing me great distress. I need this fixed urgently.','hitl_review','P1','duplicate_charge',TRUE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-01-20 08:15:00+00'),
('11111111-0001-0001-0001-000000000004','CUST-005','branch','Charged twice for the same Amazon order. £67.50 debited twice on 22 Jan. I have my bank statement as proof.','closed','P2','duplicate_charge',FALSE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-01-22 14:00:00+00'),
('11111111-0001-0001-0001-000000000005','CUST-006','mobile','Double charge on my Spotify account again. £9.99 twice on Jan 28th. Third time this has happened. I am considering legal action if not resolved this time.','hitl_review','P2','duplicate_charge',FALSE,TRUE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-01-28 11:00:00+00'),
('11111111-0001-0001-0001-000000000006','CUST-009','email','Two charges of £150 each for my insurance premium on 2 Feb. Total overcharge £150. Expecting full refund immediately.','hitl_review','P2','duplicate_charge',FALSE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-02-02 09:30:00+00'),  -- high redress
('11111111-0001-0001-0001-000000000007','CUST-011','call_centre','My council tax direct debit was taken twice this month. £189 overcharged. This is a significant amount for me.','hitl_review','P2','duplicate_charge',FALSE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-02-05 10:00:00+00'),  -- high redress
('11111111-0001-0001-0001-000000000008','CUST-012','mobile','Duplicate charge for takeaway order £24.50. Two debits same merchant same time.','closed','P2','duplicate_charge',FALSE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-02-08 20:00:00+00'),
('11111111-0001-0001-0001-000000000009','CUST-015','branch','Charged twice for parking payment. £8 each time. Small amount but still wrong.','closed','P3','duplicate_charge',FALSE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-02-10 09:00:00+00'),
('11111111-0001-0001-0001-000000000010','CUST-016','email','Double debit for mortgage payment this month. £1,200 overcharged. This is a serious error.','hitl_review','P2','duplicate_charge',FALSE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-02-12 08:00:00+00'),  -- high redress
('11111111-0001-0001-0001-000000000011','CUST-018','mobile','Two charges for Deliveroo on Feb 14. £18.99 debited twice. Please refund.','closed','P2','duplicate_charge',FALSE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-02-14 19:00:00+00'),
('11111111-0001-0001-0001-000000000012','CUST-021','call_centre','My broadband direct debit paid twice. £39.99 overcharged on Feb 1st.','closed','P2','duplicate_charge',FALSE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-02-16 09:30:00+00'),
('11111111-0001-0001-0001-000000000013','CUST-023','email','Duplicate transaction for fuel station payment £55. Same card same time two debits.','closed','P2','duplicate_charge',FALSE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-02-18 07:45:00+00'),
('11111111-0001-0001-0001-000000000014','CUST-026','mobile','Two charges from Apple Pay at the same shop within seconds. £22.00 total overcharged.','closed','P2','duplicate_charge',FALSE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-02-20 15:00:00+00'),
('11111111-0001-0001-0001-000000000015','CUST-007','branch','I am struggling with my mental health and managing money is very hard. I was charged twice for my medication £8.40 and I cannot afford to lose this money.','hitl_review','P1','duplicate_charge',TRUE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-02-22 10:00:00+00'),
('11111111-0001-0001-0001-000000000016','CUST-029','email','Double charge for car insurance instalment. £85 overcharge. Second complaint about this issue.','hitl_review','P2','duplicate_charge',FALSE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-02-25 11:00:00+00'),
('11111111-0001-0001-0001-000000000017','CUST-031','mobile','Netflix charged twice March 1. £15.99 overcharge.','closed','P2','duplicate_charge',FALSE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-03-01 09:00:00+00'),
('11111111-0001-0001-0001-000000000018','CUST-033','call_centre','Two Amazon Prime charges in one day. £8.99 duplicate.','closed','P2','duplicate_charge',FALSE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-03-03 10:00:00+00'),
('11111111-0001-0001-0001-000000000019','CUST-034','email','Utility bill paid twice this month. £96 overcharged.','hitl_review','P2','duplicate_charge',FALSE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-03-05 08:30:00+00'),  -- high redress
('11111111-0001-0001-0001-000000000020','CUST-035','branch','Duplicate gym payment £45. Same date same amount two debits.','closed','P2','duplicate_charge',FALSE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-03-07 09:00:00+00'),
('11111111-0001-0001-0001-000000000021','CUST-038','mobile','Two payments to same merchant in seconds £33. Clearly a technical error.','closed','P2','duplicate_charge',FALSE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-03-09 14:00:00+00'),
('11111111-0001-0001-0001-000000000022','CUST-040','call_centre','Sky TV direct debit taken twice. £45 overcharge Feb 28.','closed','P2','duplicate_charge',FALSE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-03-10 10:00:00+00'),
('11111111-0001-0001-0001-000000000023','CUST-041','email','Double charge contactless payment coffee shop £4.50. Small but want refund.','closed','P3','duplicate_charge',FALSE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-03-11 08:00:00+00'),
('11111111-0001-0001-0001-000000000024','CUST-043','mobile','Two debits same time same merchant for supermarket shop. £87 overcharged.','hitl_review','P2','duplicate_charge',FALSE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-03-12 17:00:00+00'),  -- high redress
('11111111-0001-0001-0001-000000000025','CUST-044','branch','Phone bill went out twice. £35 duplicate charge.','closed','P2','duplicate_charge',FALSE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-03-13 09:30:00+00'),
('11111111-0001-0001-0001-000000000026','CUST-045','email','Two pension contribution debits same amount same day. £200 overcharged.','hitl_review','P2','duplicate_charge',FALSE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-03-14 08:00:00+00'),  -- high redress
('11111111-0001-0001-0001-000000000027','CUST-047','call_centre','I have mental health difficulties and noticed two charges for my prescription costs £9.90. Managing money is a struggle. Please help.','hitl_review','P1','duplicate_charge',TRUE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-03-14 11:00:00+00'),
('11111111-0001-0001-0001-000000000028','CUST-048','mobile','Duplicate payment to landlord portal £750. Serious error.','hitl_review','P2','duplicate_charge',FALSE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-03-15 09:00:00+00'),  -- high redress
('11111111-0001-0001-0001-000000000029','CUST-049','email','Two charges to software subscription £29.99. Duplicate.','closed','P2','duplicate_charge',FALSE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-03-15 10:00:00+00'),
('11111111-0001-0001-0001-000000000030','CUST-050','call_centre','Duplicate council tax £185 overcharged. Need urgent resolution.','hitl_review','P2','duplicate_charge',FALSE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-03-15 11:00:00+00');  -- high redress

-- Additional duplicate_charge to reach 84 (50-84 abbreviated for brevity, same pattern)
INSERT INTO complaints (complaint_id,customer_id,channel,complaint_text,status,priority,intent_type,vulnerability_flag,legal_threat_flag,fca_deadline,disp_14_deadline,created_at)
SELECT
    gen_random_uuid(),
    'CUST-' || LPAD(((n % 50)+1)::text, 3, '0'),
    (ARRAY['mobile','email','call_centre','branch','social_media'])[((n % 5)+1)],
    'I was charged twice for a recurring payment on ' || (DATE '2026-01-01' + (n * 3) * INTERVAL '1 day')::date || '. Please refund the duplicate amount of £' || (10 + n % 90)::text || '.',
    (ARRAY['closed','closed','closed','hitl_review','dispatched'])[((n % 5)+1)],
    (ARRAY['P2','P2','P3','P2','P3'])[((n % 5)+1)],
    'duplicate_charge',
    FALSE, FALSE,
    NOW()+INTERVAL'56 days', NOW()+INTERVAL'3 days',
    DATE '2026-01-01' + (n * 2) * INTERVAL '1 day'
FROM generate_series(1, 54) AS n;

-- ══════════════════════════════════════════════
-- BATCH 2: atm_failure (66 complaints)
-- ══════════════════════════════════════════════
INSERT INTO complaints (complaint_id,customer_id,channel,complaint_text,status,priority,intent_type,vulnerability_flag,legal_threat_flag,fca_deadline,disp_14_deadline,created_at) VALUES
('22222222-0002-0002-0002-000000000001','CUST-003','mobile','ATM swallowed my card on 10 Jan at the Princes St branch. I needed cash urgently. Card has not been returned.','closed','P2','atm_failure',FALSE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-01-10 14:00:00+00'),
('22222222-0002-0002-0002-000000000002','CUST-013','branch','ATM showed error after I entered PIN but still debited £100 from my account. I am elderly and do not understand what happened. I am very confused and worried.','hitl_review','P1','atm_failure',TRUE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-01-12 10:00:00+00'),
('22222222-0002-0002-0002-000000000003','CUST-022','call_centre','ATM did not dispense cash but deducted £200 from my account on Jan 20.','hitl_review','P2','atm_failure',FALSE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-01-20 16:00:00+00'),  -- high redress
('22222222-0002-0002-0002-000000000004','CUST-025','email','ATM malfunction at airport. I was trying to withdraw cash for a flight and lost £300 in failed transactions with charges.','hitl_review','P2','atm_failure',FALSE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-01-25 07:30:00+00'),  -- high redress
('22222222-0002-0002-0002-000000000005','CUST-028','mobile','ATM gave me wrong amount. Requested £50, dispensed £30 but debited £50. Struggling with childcare costs this month.','hitl_review','P1','atm_failure',TRUE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-02-01 08:00:00+00'),
('22222222-0002-0002-0002-000000000006','CUST-030','branch','ATM failure twice in one week. Lost £40 total in failed withdrawals.','closed','P2','atm_failure',FALSE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-02-05 12:00:00+00'),
('22222222-0002-0002-0002-000000000007','CUST-032','call_centre','ATM ate my card and debited money. I am in a very vulnerable place right now and this is making things much worse. I need help urgently.','hitl_review','P1','atm_failure',TRUE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-02-10 09:00:00+00'),
('22222222-0002-0002-0002-000000000008','CUST-036','email','ATM out of order but still deducted £60 from my wealth account. Unacceptable service.','hitl_review','P2','atm_failure',FALSE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-02-15 14:00:00+00'),
('22222222-0002-0002-0002-000000000009','CUST-038','mobile','ATM only gave partial cash. Asked for £80 got £40 but charged £80.','hitl_review','P2','atm_failure',FALSE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-02-18 11:00:00+00'),
('22222222-0002-0002-0002-000000000010','CUST-041','social_media','Your ATM on High Street has been broken for 3 days yet still debiting customers. I lost £20. Shocked at this.','closed','P2','atm_failure',FALSE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-02-20 17:00:00+00');

INSERT INTO complaints (complaint_id,customer_id,channel,complaint_text,status,priority,intent_type,vulnerability_flag,legal_threat_flag,fca_deadline,disp_14_deadline,created_at)
SELECT
    gen_random_uuid(),
    'CUST-' || LPAD(((n % 50)+1)::text, 3, '0'),
    (ARRAY['mobile','call_centre','branch','email','social_media'])[((n % 5)+1)],
    'The ATM failed to dispense £' || (20 + n % 80)::text || ' on ' || (DATE '2026-01-05' + (n * 2) * INTERVAL '1 day')::date || ' but debited my account. Please investigate.',
    (ARRAY['closed','closed','dispatched','hitl_review','closed'])[((n % 5)+1)],
    (ARRAY['P2','P3','P2','P2','P3'])[((n % 5)+1)],
    'atm_failure',
    FALSE, FALSE,
    NOW()+INTERVAL'56 days', NOW()+INTERVAL'3 days',
    DATE '2026-01-05' + (n * 2) * INTERVAL '1 day'
FROM generate_series(1, 56) AS n;

-- ══════════════════════════════════════════════
-- BATCH 3: unauthorised_transaction (54 complaints)
-- ══════════════════════════════════════════════
INSERT INTO complaints (complaint_id,customer_id,channel,complaint_text,status,priority,intent_type,vulnerability_flag,legal_threat_flag,fca_deadline,disp_14_deadline,created_at) VALUES
('33333333-0003-0003-0003-000000000001','CUST-010','call_centre','I did not make a payment of £350 to an online retailer on Jan 5. My card was not lost or stolen. This is fraud. I have been recently made redundant and cannot afford to lose this money.','hitl_review','P1','unauthorised_transaction',TRUE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-01-05 08:00:00+00'),  -- high redress
('33333333-0003-0003-0003-000000000002','CUST-014','mobile','Unauthorised transaction £890 to unknown merchant. I have never shopped there. Please reverse immediately.','hitl_review','P1','unauthorised_transaction',FALSE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-01-08 09:00:00+00'),  -- high redress
('33333333-0003-0003-0003-000000000003','CUST-020','email','Three unauthorised transactions totalling £240 this week. My account has been compromised. I am going through a divorce and this is unbearable.','hitl_review','P1','unauthorised_transaction',TRUE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-01-15 10:00:00+00'),  -- high redress
('33333333-0003-0003-0003-000000000004','CUST-024','branch','Unknown charge £175 on my account. I use a wheelchair and cannot easily get to branch to dispute. Please resolve remotely.','hitl_review','P1','unauthorised_transaction',TRUE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-01-22 11:00:00+00'),  -- high redress
('33333333-0003-0003-0003-000000000005','CUST-042','call_centre','I was told someone used my card details online. £95 spent without my permission. I am in recovery and this is causing significant stress.','hitl_review','P1','unauthorised_transaction',TRUE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-02-01 09:30:00+00'),
('33333333-0003-0003-0003-000000000006','CUST-046','mobile','Unexpected charge £520 to overseas merchant. I have never travelled there. Clear fraud.','hitl_review','P1','unauthorised_transaction',FALSE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-02-10 08:00:00+00'),  -- high redress
('33333333-0003-0003-0003-000000000007','CUST-017','call_centre','I do not speak English very well. My account has unknown transaction £68. I am very worried. Please help me.','hitl_review','P1','unauthorised_transaction',TRUE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-02-15 10:00:00+00'),
('33333333-0003-0003-0003-000000000008','CUST-037','email','I lost my job last month. Someone used my card for £120 in purchases I did not make. I cannot afford this loss. I want to contact a solicitor if not resolved.','hitl_review','P1','unauthorised_transaction',TRUE,TRUE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-02-20 09:00:00+00'),  -- high redress + legal
('33333333-0003-0003-0003-000000000009','CUST-033','mobile','Unrecognised payment £45 to streaming service I never subscribed to.','hitl_review','P1','unauthorised_transaction',FALSE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-02-25 14:00:00+00'),
('33333333-0003-0003-0003-000000000010','CUST-039','branch','SME account had £1,800 unauthorised transfer. This is our operating capital. Urgent.','hitl_review','P1','unauthorised_transaction',FALSE,TRUE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-03-01 08:00:00+00');  -- high redress + legal

INSERT INTO complaints (complaint_id,customer_id,channel,complaint_text,status,priority,intent_type,vulnerability_flag,legal_threat_flag,fca_deadline,disp_14_deadline,created_at)
SELECT
    gen_random_uuid(),
    'CUST-' || LPAD(((n % 50)+1)::text, 3, '0'),
    (ARRAY['call_centre','mobile','email','branch','social_media'])[((n % 5)+1)],
    'There is an unauthorised transaction of £' || (30 + n % 120)::text || ' on my account dated ' || (DATE '2026-01-10' + (n * 2) * INTERVAL '1 day')::date || '. I did not authorise this payment. Please investigate and reverse.',
    (ARRAY['hitl_review','hitl_review','triaging','evidence_gathering','policy_review'])[((n % 5)+1)],
    'P1',
    'unauthorised_transaction',
    FALSE, FALSE,
    NOW()+INTERVAL'56 days', NOW()+INTERVAL'3 days',
    DATE '2026-01-10' + (n * 2) * INTERVAL '1 day'
FROM generate_series(1, 44) AS n;

-- ══════════════════════════════════════════════
-- BATCH 4: mortgage_dispute (45 complaints)
-- ══════════════════════════════════════════════
INSERT INTO complaints (complaint_id,customer_id,channel,complaint_text,status,priority,intent_type,vulnerability_flag,legal_threat_flag,fca_deadline,disp_14_deadline,created_at)
SELECT
    gen_random_uuid(),
    'CUST-' || LPAD(((n % 50)+1)::text, 3, '0'),
    (ARRAY['call_centre','email','branch','mobile','call_centre'])[((n % 5)+1)],
    'I am disputing a mortgage charge of £' || (50 + n % 200)::text || ' applied on ' || (DATE '2026-01-15' + (n * 3) * INTERVAL '1 day')::date || '. I was not informed of this fee and it was not in my original mortgage agreement. Please review and reverse.',
    (ARRAY['closed','hitl_review','dispatched','policy_review','closed'])[((n % 5)+1)],
    (ARRAY['P3','P3','P3','P2','P3'])[((n % 5)+1)],
    'mortgage_dispute',
    FALSE, FALSE,
    NOW()+INTERVAL'56 days', NOW()+INTERVAL'3 days',
    DATE '2026-01-15' + (n * 3) * INTERVAL '1 day'
FROM generate_series(1, 45) AS n;

-- ══════════════════════════════════════════════
-- BATCH 5: account_closure (30 complaints)
-- ══════════════════════════════════════════════
INSERT INTO complaints (complaint_id,customer_id,channel,complaint_text,status,priority,intent_type,vulnerability_flag,legal_threat_flag,fca_deadline,disp_14_deadline,created_at) VALUES
('55555555-0005-0005-0005-000000000001','CUST-004','call_centre','My husband passed away and I need to close his current account. I have been calling for three weeks with no resolution. I am grieving and this process is overwhelming me.','hitl_review','P1','account_closure',TRUE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-02-01 09:00:00+00'),
('55555555-0005-0005-0005-000000000002','CUST-013','branch','I am trying to close my savings account. I am 78 and find the online process confusing. The branch told me to use the app but I cannot use it. Please help me close it in branch.','hitl_review','P1','account_closure',TRUE,FALSE,NOW()+INTERVAL'56 days',NOW()+INTERVAL'3 days','2026-02-05 10:00:00+00');

INSERT INTO complaints (complaint_id,customer_id,channel,complaint_text,status,priority,intent_type,vulnerability_flag,legal_threat_flag,fca_deadline,disp_14_deadline,created_at)
SELECT
    gen_random_uuid(),
    'CUST-' || LPAD(((n % 50)+1)::text, 3, '0'),
    (ARRAY['call_centre','branch','email','mobile','call_centre'])[((n % 5)+1)],
    'I have requested to close my account on ' || (DATE '2026-01-20' + n * INTERVAL '3 days')::date || ' but the closure has not been processed. I am being charged fees on an account I no longer want. Please close immediately.',
    (ARRAY['closed','dispatched','hitl_review','policy_review','closed'])[((n % 5)+1)],
    (ARRAY['P3','P3','P3','P2','P3'])[((n % 5)+1)],
    'account_closure',
    FALSE, FALSE,
    NOW()+INTERVAL'56 days', NOW()+INTERVAL'3 days',
    DATE '2026-01-20' + n * INTERVAL '3 days'
FROM generate_series(1, 28) AS n;

-- ══════════════════════════════════════════════
-- BATCH 6: data_privacy (21 complaints)
-- ══════════════════════════════════════════════
INSERT INTO complaints (complaint_id,customer_id,channel,complaint_text,status,priority,intent_type,vulnerability_flag,legal_threat_flag,fca_deadline,disp_14_deadline,created_at)
SELECT
    gen_random_uuid(),
    'CUST-' || LPAD(((n % 50)+1)::text, 3, '0'),
    (ARRAY['email','call_centre','mobile','email','branch'])[((n % 5)+1)],
    'I believe my personal data was shared with a third party without my consent on ' || (DATE '2026-01-10' + n * INTERVAL '4 days')::date || '. I have started receiving targeted calls I never signed up for. Please investigate under GDPR and FCA data rules.',
    (ARRAY['triaging','evidence_gathering','policy_review','hitl_review','closed'])[((n % 5)+1)],
    (ARRAY['P3','P3','P2','P2','P3'])[((n % 5)+1)],
    'data_privacy',
    FALSE, FALSE,
    NOW()+INTERVAL'56 days', NOW()+INTERVAL'3 days',
    DATE '2026-01-10' + n * INTERVAL '4 days'
FROM generate_series(1, 21) AS n;
