-- Two seeded photo tasks pointed at images that were never shipped with the
-- application. Point them at the verified local image that matches the prompt.
UPDATE questions
SET content_payload = jsonb_set(content_payload, '{imageUrl}', '"/drills/wp-31.jpg"')
WHERE content_payload->>'imageUrl' = '/images/practice/engineering-workshop.jpg';

UPDATE questions
SET content_payload = jsonb_set(content_payload, '{imageUrl}', '"/drills/wp-2.jpg"')
WHERE content_payload->>'imageUrl' = '/images/practice/park-gathering.jpg';

UPDATE questions
SET content_payload = jsonb_set(content_payload, '{imageUrl}', '"/drills/wp-28.jpg"')
WHERE content_payload->>'imageUrl' = '/images/practice/student-library.jpg';

UPDATE questions
SET content_payload = jsonb_set(content_payload, '{imageUrl}', '"/drills/wp-1.jpg"')
WHERE content_payload->>'imageUrl' = '/images/practice/laboratory-science.jpg';

UPDATE questions
SET content_payload = jsonb_set(content_payload, '{imageUrl}', '"/drills/wp-32.jpg"')
WHERE content_payload->>'imageUrl' = '/images/practice/university-lecture.jpg';

UPDATE questions
SET content_payload = jsonb_set(content_payload, '{imageUrl}', '"/drills/wp-18.jpg"')
WHERE content_payload->>'imageUrl' = '/images/practice/city-skyline.jpg';
