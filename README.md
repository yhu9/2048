# 2048, with falling tiles
A version of [2048](https://github.com/gabrielecirulli/2048) in which the tiles fall. One tile at a time comes in at the top of the board and falls by itself. You steer it, drop it, and merge tiles with the same number until you make the 2048 tile.

[Play it here!](https://yhu9.github.io/2048/)

<p align="center">
  <img src="meta/screenshot.png" alt="A game in play: landed tiles at the bottom of the board and a 2 falling from the top" width="330"/>
</p>

## How to play
The board has 4 columns and 6 rows, and starts empty. The game now plays more
like tetris and the numbers spawn at the top and fall down to the bottom. I
removed the up key, but otherwise the game plays exactly the same as the
previous 2048 game.

## Playing the game locally
To play the game locally, get the code and serve the folder over http: for example with Python

```sh
git clone https://github.com/yhu9/2048.git
cd 2048
python3 -m http.server 8000
```

Then open http://localhost:8000 in a current version of Chrome, Firefox, Safari or Edge.

## Running the tests
The tests need [Node.js](https://nodejs.org/) 18 or later. Install the test dependencies once, then run the suite:

```sh
npm ci
npm test
```

## Changing the styles
`style/main.css` is compiled from `style/main.scss` with [Sass](https://sass-lang.com/), so change the `.scss` file and compile it again:

```sh
npx sass --no-source-map style/main.scss style/main.css
```

## Contributing
Changes and improvements are more than welcome! Feel free to fork [yhu9/2048](https://github.com/yhu9/2048) and open a pull request. Please make your changes in a specific branch and request to pull into `master`! If you can, please make sure the game fully works before sending the PR, as that will help speed up the process.

You can find the same information in the [contributing guide.](https://github.com/yhu9/2048/blob/master/CONTRIBUTING.md)

## Credits
This is a fork of [2048 by Gabriele Cirulli](https://github.com/gabrielecirulli/2048), which you can [play here](http://gabrielecirulli.github.io/2048/) and which also has official apps on the [Play Store](https://play.google.com/store/apps/details?id=com.gabrielecirulli.app2048) and the [App Store](https://itunes.apple.com/us/app/2048-by-gabriele-cirulli/id868076805). The original is a small clone of [1024](https://play.google.com/store/apps/details?id=com.veewo.a1024), based on [Saming's 2048](http://saming.fr/p/2048/) (also a clone), and was indirectly inspired by [Threes](https://asherv.com/threes/).

[Anna Harren](https://github.com/iirelu/) and [sigod](https://github.com/sigod) maintain the original repository. Other notable contributors to it:

 - [TimPetricola](https://github.com/TimPetricola) added best score storage
 - [chrisprice](https://github.com/chrisprice) added custom code for swipe handling on mobile
 - [marcingajda](https://github.com/marcingajda) made swipes work on Windows Phone
 - [mgarciaisaia](https://github.com/mgarciaisaia) added support for Android 2.3

Many thanks to [rayhaanj](https://github.com/rayhaanj), [Mechazawa](https://github.com/Mechazawa), [grant](https://github.com/grant), [remram44](https://github.com/remram44) and [ghoullier](https://github.com/ghoullier) for the many other good contributions.

If you enjoy the game and feel like buying its original author a coffee, donations go to Gabriele Cirulli's BTC address: `1Ec6onfsQmoP9kkL3zkpB6c5sA4PVcXU2i`.

## License
2048 is licensed under the [MIT license.](https://github.com/yhu9/2048/blob/master/LICENSE.txt)
