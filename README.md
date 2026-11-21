# 2048
A small clone of [1024](https://play.google.com/store/apps/details?id=com.veewo.a1024), based on [Saming's 2048](http://saming.fr/p/2048/) (also a clone). 2048 was indirectly inspired by [Threes](https://asherv.com/threes/).

Made just for fun. [Play it here!](http://gabrielecirulli.github.io/2048/)

The official app can also be found on the [Play Store](https://play.google.com/store/apps/details?id=com.gabrielecirulli.app2048) and [App Store!](https://itunes.apple.com/us/app/2048-by-gabriele-cirulli/id868076805)

### Contributions

[Anna Harren](https://github.com/iirelu/) and [sigod](https://github.com/sigod) are maintainers for this repository.

Other notable contributors:

 - [TimPetricola](https://github.com/TimPetricola) added best score storage
 - [chrisprice](https://github.com/chrisprice) added custom code for swipe handling on mobile
 - [marcingajda](https://github.com/marcingajda) made swipes work on Windows Phone
 - [mgarciaisaia](https://github.com/mgarciaisaia) added support for Android 2.3

Many thanks to [rayhaanj](https://github.com/rayhaanj), [Mechazawa](https://github.com/Mechazawa), [grant](https://github.com/grant), [remram44](https://github.com/remram44) and [ghoullier](https://github.com/ghoullier) for the many other good contributions.

### Screenshot

<p align="center">
  <img src="https://cloud.githubusercontent.com/assets/1175750/8614312/280e5dc2-26f1-11e5-9f1f-5891c3ca8b26.png" alt="Screenshot"/>
</p>

That screenshot is fake, by the way. I never reached 2048 :smile:

## How to play
The board has 4 columns and 6 rows. One tile at a time comes in at the top and falls one cell every half second.

- **Left** and **right** slide the landed tiles as far as they can go, and then steer the falling tile one cell. Steered into a tile of the same number, it merges with it and has landed.
- **Down** drops every tile as far down as it can go, and lands the falling tile.
- **Up** does nothing.

A falling tile merges with a tile of the same number below it. When it can't go any further it lands, and the next tile comes in at the top. While the top row is full no tile comes in, but you can still move the landed tiles to make room. The game is over when the top row is full and no move is left.

## Board sizes
The game is played on 4 columns and 6 rows, set by `DEFAULT_BOARD_SIZE` in `js/board_size.js`. The code works on any board the stylesheet has tile positions for, which is up to 8 columns and 6 rows. Each board size keeps its own best score, and a saved game is loaded on the board it was saved with.

## Playing the game locally
The game is written as ES modules, which browsers only load from a web server, so opening `index.html` straight from disk doesn't work. Serve the folder instead, for example with Python:

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000 in a current version of Chrome, Firefox, Safari or Edge.

## Running the tests
The tests need [Node.js](https://nodejs.org/) 18 or later. Install the test dependencies once, then run the suite:

```sh
npm ci
npm test
```

## Contributing
Changes and improvements are more than welcome! Feel free to fork and open a pull request. Please make your changes in a specific branch and request to pull into `master`! If you can, please make sure the game fully works before sending the PR, as that will help speed up the process.

You can find the same information in the [contributing guide.](https://github.com/gabrielecirulli/2048/blob/master/CONTRIBUTING.md)

## License
2048 is licensed under the [MIT license.](https://github.com/gabrielecirulli/2048/blob/master/LICENSE.txt)

## Donations
I made this in my spare time, and it's hosted on GitHub (which means I don't have any hosting costs), but if you enjoyed the game and feel like buying me coffee, you can donate at my BTC address: `1Ec6onfsQmoP9kkL3zkpB6c5sA4PVcXU2i`. Thank you very much!
