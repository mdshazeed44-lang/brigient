---
source: https://brigient.com/
title: Testimonials (homepage carousel)
---

NOT FOUND - carousel is empty in the page HTML.

Details from raw HTML inspection of https://brigient.com/ :

- The testimonials section exists (`<div class="testimonials_area">` with heading "Check Out Our Cybersecurity Company Reviews", tagline "Testimonials") and uses an Owl Carousel (`owl-carousel testimonial-carousel`).
- The carousel stage (`owl-stage`) is completely empty. The template even contains a commented-out fallback: `<!--<h5> Sorry, No Post Data Found. </h5>-->`, confirming the WordPress testimonial post query returned zero posts.
- No reviewer names, quotes, or star ratings exist anywhere in the HTML. No external review script populates it.

Conclusion: the live site currently has no testimonial content to migrate. Do NOT invent testimonials for the redesign; either source real reviews from the client or omit the section.
