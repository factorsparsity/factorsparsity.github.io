# factorsparsity

Personal site of Larry Davis. Companion to [typif.ai](https://typif.ai).

Named after the [sparsity-of-effects principle](https://en.wikipedia.org/wiki/Sparsity-of-effects_principle)
and the [Pareto principle](https://en.wikipedia.org/wiki/Pareto_principle): a few factors drive most of the effect.

## Structure

- `index.html` — home: generative hero, **Signal** (featured projects), **Noise** (small stuff), About.
- `assets/site.js` — hero canvas (Pareto-distributed dot field that sparsifies on scroll) and scroll reveals.
- `assets/style.css` — all styles. Dark only.
- `projects/*.html` — optional write-up page per project. Copy `projects/example.html`.

Plain static HTML/CSS/JS, no build step. Serve locally with:

```sh
python3 -m http.server 8000
```

## Adding things

- **Featured project:** add an `<li class="work">` in `#signal`. Index with factor codes (A, B, AB, …).
  Link to the repo or a page in `projects/`. Keep it to a few — that's the point.
- **Small thing:** add an `<li>` at the top of `#noise`.
