# Poster source

`poster_asim2026_zoning_lod.pptx` is the editable A0 poster as presented at ASIM 2026: the authors' manually finished version, with the case counts corrected to the poster's nine models (9,414 cases per load, 8,012 unique runs). Its PDF export is `docs/assets/poster.pdf`, which the site serves.

How it was made:
1. **Scripted build.** `research/reduced-campaign/figures-f1/poster-asim2026/build_poster.py` in the BEMGen repository builds the poster in the conference template; `poster_figs.py` draws its figures from the F1 figure data.
2. **Manual finishing.** The authors moved the QR code into the header and added the affiliation and support logos to the footer.
3. **Count correction.** The setup bullet was changed from 11,506 / 10,104 (the journal's eleven methods) to 9,414 / 8,012. Nothing else was changed.

Rebuilding from the scripts gives the poster before steps 2 and 3, so edit this file for any change to the presented poster. Typeface: Calibri, body text 32 pt or more, as the template requires.
