-- Initial Seed Data for DET Academy

-- Default Users:
-- password for admin is 'admin123'
-- password for alex & student is 'password123'
INSERT INTO users (id, email, password_hash, name, role, avatar_url, locale)
VALUES 
    ('00000000-0000-0000-0000-000000000000', 'admin@det-academy.com', '$2a$10$QeuP0mMvXlrZ74xIjWl2seR.wehogINtVG/JV8a0PCYDZwINP64tm', 'Super Administrator', 'admin', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', 'ru'),
    ('00000000-0000-0000-0000-000000000001', 'alex@det-academy.com', '$2a$10$7QeHn3Xut56.7yiAR1yN6uBQuT5VbG0HZ8cK7ld.kxZPLlV31r6Q6', 'Alex Rivera', 'admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'en'),
    ('00000000-0000-0000-0000-000000000002', 'student@det-academy.com', '$2a$10$7QeHn3Xut56.7yiAR1yN6uBQuT5VbG0HZ8cK7ld.kxZPLlV31r6Q6', 'Demo Student', 'student', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'ru')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role;

-- Completed Theory for Alex Rivera (all 12 lessons completed)
INSERT INTO theory_progress (user_id, lesson_slug, is_completed)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'rules-and-technicalities', TRUE),
    ('00000000-0000-0000-0000-000000000001', 'read-and-select', TRUE),
    ('00000000-0000-0000-0000-000000000001', 'fill-in-the-blanks', TRUE),
    ('00000000-0000-0000-0000-000000000001', 'read-and-complete', TRUE),
    ('00000000-0000-0000-0000-000000000001', 'listen-and-type', TRUE),
    ('00000000-0000-0000-0000-000000000001', 'interactive-reading', TRUE),
    ('00000000-0000-0000-0000-000000000001', 'interactive-listening', TRUE),
    ('00000000-0000-0000-0000-000000000001', 'write-about-the-photo', TRUE),
    ('00000000-0000-0000-0000-000000000001', 'speak-about-the-photo', TRUE),
    ('00000000-0000-0000-0000-000000000001', 'interactive-writing', TRUE),
    ('00000000-0000-0000-0000-000000000001', 'read-listen-speak', TRUE),
    ('00000000-0000-0000-0000-000000000001', 'interactive-speaking', TRUE)
ON CONFLICT (user_id, lesson_slug) DO UPDATE SET is_completed = TRUE;

-- Ad Banners
INSERT INTO ad_banners (id, placement, image_url, target_url, alt_text, is_active, impressions, clicks)
VALUES
    ('10000000-0000-0000-0000-000000000001', 'HEADER', '', 'https://so-called-spark.ru', 'Выиграй грант $20,000 на учёбу в США — «так называемый SPARK». Промокод DET_ACADEMY', TRUE, 420, 15),
    ('10000000-0000-0000-0000-000000000002', 'FOOTER', '', 'https://so-called-spark.ru', '#так_называемый_SPARK · Набор открыт, старт заявочной кампании — октябрь 2026. Промокод DET_ACADEMY', TRUE, 380, 22)
ON CONFLICT (id) DO NOTHING;

-- Demo Test Session for Alex Rivera
INSERT INTO test_sessions (id, user_id, candidate_name, status, current_stage, stage_name, difficulty_level, overall_score, literacy_score, comprehension_score, production_score, conversation_score, created_at, completed_at)
VALUES (
    '20000000-0000-0000-0000-000000000001',
    ('00000000-0000-0000-0000-000000000001'),
    'Alex Rivera',
    'COMPLETED',
    10,
    'COMPLETED',
    'C1',
    125,
    120,
    130,
    125,
    125,
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '45 minutes'
) ON CONFLICT (id) DO NOTHING;

-- Demo Certificate for verification (used at /verify/det-cert-8f921a4)
INSERT INTO certificates (id, user_id, test_session_id, candidate_name, overall_score, literacy_score, comprehension_score, production_score, conversation_score, issued_at, pdf_url)
VALUES (
    'det-cert-8f921a4',
    '00000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'Alex Rivera',
    125,
    120,
    130,
    125,
    125,
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    '/certificates/det-cert-8f921a4.pdf'
) ON CONFLICT (id) DO NOTHING;

-- Universities accepting DET
INSERT INTO institutions (id, name, country, city, state, min_score, subscore_reqs, latitude, longitude, website_url, category, acceptance_rate, programs)
VALUES
    ('inst-harvard', 'Harvard University', 'United States', 'Cambridge', 'MA', 125, 'Рекомендуется от 120 по каждому сабскору', 42.3770, -71.1167, 'https://www.harvard.edu', 'Ivy League', '3.4%', ARRAY['Undergraduate', 'Graduate', 'PhD']),
    ('inst-mit', 'Massachusetts Institute of Technology (MIT)', 'United States', 'Cambridge', 'MA', 125, 'Минимум 120 в Literacy & Production', 42.3601, -71.0942, 'https://www.mit.edu', 'Top STEM', '4.0%', ARRAY['Undergraduate', 'Engineering', 'Graduate']),
    ('inst-stanford', 'Stanford University', 'United States', 'Stanford', 'CA', 120, 'Конкурентный балл 125+', 37.4275, -122.1697, 'https://www.stanford.edu', 'Top Global', '3.9%', ARRAY['Undergraduate', 'Graduate', 'MBA']),
    ('inst-yale', 'Yale University', 'United States', 'New Haven', 'CT', 125, 'Минимум 120 по всем 4 сабскорам', 41.3163, -72.9223, 'https://www.yale.edu', 'Ivy League', '4.5%', ARRAY['Undergraduate', 'Graduate', 'Law']),
    ('inst-columbia', 'Columbia University', 'United States', 'New York', 'NY', 125, 'Минимум 125 для бакалавриата', 40.8075, -73.9626, 'https://www.columbia.edu', 'Ivy League', '3.9%', ARRAY['Undergraduate', 'Graduate', 'Columbia College']),
    ('inst-princeton', 'Princeton University', 'United States', 'Princeton', 'NJ', 125, 'Рекомендуется 130+', 40.3440, -74.6514, 'https://www.princeton.edu', 'Ivy League', '4.4%', ARRAY['Undergraduate', 'Graduate']),
    ('inst-upenn', 'University of Pennsylvania', 'United States', 'Philadelphia', 'PA', 120, '125+ для Wharton School', 39.9522, -75.1932, 'https://www.upenn.edu', 'Ivy League', '5.9%', ARRAY['Undergraduate', 'Wharton', 'Graduate']),
    ('inst-cornell', 'Cornell University', 'United States', 'Ithaca', 'NY', 120, '120 Literacy & Conversation', 42.4534, -76.4735, 'https://www.cornell.edu', 'Ivy League', '7.3%', ARRAY['Undergraduate', 'Graduate']),
    ('inst-nyu', 'New York University (NYU)', 'United States', 'New York', 'NY', 130, 'Строго 130+ для большинства программ', 40.7295, -73.9965, 'https://www.nyu.edu', 'Top Global', '8.0%', ARRAY['Undergraduate', 'Stern', 'Tisch', 'Graduate']),
    ('inst-uchicago', 'University of Chicago', 'United States', 'Chicago', 'IL', 125, '125+ по шкале DET', 41.7886, -87.5987, 'https://www.uchicago.edu', 'Top Global', '4.8%', ARRAY['Undergraduate', 'Booth MBA', 'Graduate']),
    ('inst-ucla', 'University of California, Los Angeles (UCLA)', 'United States', 'Los Angeles', 'CA', 120, 'Конкурентный 125+', 34.0689, -118.4452, 'https://www.ucla.edu', 'Public Ivy', '8.6%', ARRAY['Undergraduate', 'Graduate']),
    ('inst-berkeley', 'UC Berkeley', 'United States', 'Berkeley', 'CA', 125, '120+ в каждом сабскоре', 37.8719, -122.2585, 'https://www.berkeley.edu', 'Public Ivy', '11.6%', ARRAY['Undergraduate', 'Engineering', 'Haas']),
    ('inst-cmu', 'Carnegie Mellon University', 'United States', 'Pittsburgh', 'PA', 125, '125 Literacy, 120 Conversation', 40.4432, -79.9428, 'https://www.cmu.edu', 'Top STEM', '11.0%', ARRAY['Computer Science', 'Engineering', 'Graduate']),
    ('inst-toronto', 'University of Toronto', 'Canada', 'Toronto', 'ON', 120, 'Минимум 120 в Overall', 43.6629, -79.3957, 'https://www.utoronto.ca', 'Canadian Top', '43.0%', ARRAY['Undergraduate', 'Graduate', 'Rotman']),
    ('inst-mcgill', 'McGill University', 'Canada', 'Montreal', 'QC', 115, '120 для отдельных факультетов', 45.5048, -73.5772, 'https://www.mcgill.ca', 'Canadian Top', '39.0%', ARRAY['Undergraduate', 'Graduate']),
    ('inst-ubc', 'University of British Columbia (UBC)', 'Canada', 'Vancouver', 'BC', 125, 'Минимум 115 по каждому сабскору', 49.2606, -123.2460, 'https://www.ubc.ca', 'Canadian Top', '44.0%', ARRAY['Undergraduate', 'Graduate', 'Sauder']),
    ('inst-waterloo', 'University of Waterloo', 'Canada', 'Waterloo', 'ON', 120, '120+ для CS и Инженерии', 43.4723, -80.5449, 'https://uwaterloo.ca', 'Top STEM', '53.0%', ARRAY['Computer Science', 'Engineering', 'Math']),
    ('inst-oxford', 'University of Oxford', 'United Kingdom', 'Oxford', '', 125, '120+ в каждом сабскоре', 51.7548, -1.2544, 'https://www.ox.ac.uk', 'Russell Group', '14.5%', ARRAY['Undergraduate', 'Postgraduate']),
    ('inst-cambridge', 'University of Cambridge', 'United Kingdom', 'Cambridge', '', 125, '120+ сабскоры', 52.2043, 0.1149, 'https://www.cam.ac.uk', 'Russell Group', '16.0%', ARRAY['Undergraduate', 'Postgraduate']),
    ('inst-imperial', 'Imperial College London', 'United Kingdom', 'London', '', 125, 'Минимум 115 по каждому элементу', 51.4988, -0.1749, 'https://www.imperial.ac.uk', 'Russell Group', '11.5%', ARRAY['Engineering', 'Medicine', 'Natural Sciences']),
    ('inst-ucl', 'University College London (UCL)', 'United Kingdom', 'London', '', 120, 'Level 1: 115, Level 2: 125', 51.5246, -0.1340, 'https://www.ucl.ac.uk', 'Russell Group', '15.0%', ARRAY['Undergraduate', 'Postgraduate']),
    ('inst-edinburgh', 'University of Edinburgh', 'United Kingdom', 'Edinburgh', '', 115, '115 Overall', 55.9445, -3.1892, 'https://www.ed.ac.uk', 'Russell Group', '33.0%', ARRAY['Undergraduate', 'Postgraduate']),
    ('inst-kcl', 'King''s College London', 'United Kingdom', 'London', '', 120, 'Band B/C: 115–125', 51.5115, -0.1160, 'https://www.kcl.ac.uk', 'Russell Group', '13.0%', ARRAY['Undergraduate', 'Law', 'Business']),
    ('inst-tum', 'Technical University of Munich (TUM)', 'Germany', 'Munich', 'Bavaria', 115, 'English taught MSc programs', 48.1479, 11.5678, 'https://www.tum.de', 'Europe', '25.0%', ARRAY['Graduate', 'Engineering', 'Data Science']),
    ('inst-amsterdam', 'University of Amsterdam', 'Netherlands', 'Amsterdam', '', 115, '115 Overall, min 105 in subscores', 52.3558, 4.9555, 'https://www.uva.nl', 'Europe', '20.0%', ARRAY['BSc International', 'MSc International']),
    ('inst-trinity', 'Trinity College Dublin', 'Ireland', 'Dublin', '', 110, 'Минимум 110 Overall', 53.3438, -6.2546, 'https://www.tcd.ie', 'Europe', '33.5%', ARRAY['Undergraduate', 'Postgraduate']),
    ('inst-melbourne', 'University of Melbourne', 'Australia', 'Melbourne', 'VIC', 115, '115-120 в зависимости от программы', -37.7964, 144.9612, 'https://www.unimelb.edu.au', 'Top Global', '70.0%', ARRAY['Undergraduate', 'Graduate']),
    ('inst-sydney', 'University of Sydney', 'Australia', 'Sydney', 'NSW', 120, '115 minimum in subscores', -33.8886, 151.1873, 'https://www.sydney.edu.au', 'Top Global', '30.0%', ARRAY['Undergraduate', 'Graduate']),
    ('inst-nus', 'National University of Singapore (NUS)', 'Singapore', 'Singapore', '', 120, '125+ для Business и Computing', 1.2966, 103.7764, 'https://www.nus.edu.sg', 'Top Global', '5.0%', ARRAY['Undergraduate', 'Graduate'])
ON CONFLICT (id) DO NOTHING;
