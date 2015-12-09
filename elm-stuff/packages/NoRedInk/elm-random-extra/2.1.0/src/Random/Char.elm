module Random.Char where
{-| List of Char Generators

# Basic Generators
@docs char, lowerCaseLatin, upperCaseLatin, latin, english, ascii, unicode

# Unicode Generators (UTF-8)
@docs basicLatin, latin1Supplement, latinExtendedA, latinExtendedB, ipaExtensions, spacingModifier, combiningDiacriticalMarks, greekAndCoptic, cyrillic, cyrillicSupplement, armenian, hebrew, arabic, syriac, arabicSupplement, thaana, nko, samaritan, mandaic, arabicExtendedA, devanagari, bengali, gurmukhi, gujarati, oriya, tamil, telugu, kannada, malayalam, sinhala, thai, lao, tibetan, myanmar, georgian, hangulJamo, ethiopic, ethiopicSupplement, cherokee, unifiedCanadianAboriginalSyllabic, ogham, runic, tagalog, hanunoo, buhid, tagbanwa, khmer, mongolian, unifiedCanadianAboriginalSyllabicExtended, limbu, taiLe, newTaiLue, khmerSymbol, buginese, taiTham, balinese, sundanese, batak, lepcha, olChiki, sundaneseSupplement, vedicExtensions, phoneticExtensions, phoneticExtensionsSupplement, combiningDiacriticalMarksSupplement, latinExtendedAdditional, greekExtended, generalPunctuation, superscriptOrSubscript, currencySymbol, combiningDiacriticalMarksForSymbols, letterlikeSymbol, numberForm, arrow, mathematicalOperator, miscellaneousTechnical, controlPicture, opticalCharacterRecognition, enclosedAlphanumeric, boxDrawing, blockElement, geometricShape, miscellaneousSymbol, dingbat, miscellaneousMathematicalSymbolA, supplementalArrowA, braillePattern, supplementalArrowB, miscellaneousMathematicalSymbolB, supplementalMathematicalOperator, miscellaneousSymbolOrArrow, glagolitic, latinExtendedC, coptic, georgianSupplement, tifinagh, ethiopicExtended, cyrillicExtendedA, supplementalPunctuation, cjkRadicalSupplement, kangxiRadical, ideographicDescription, cjkSymbolOrPunctuation, hiragana, katakana, bopomofo, hangulCompatibilityJamo, kanbun, bopomofoExtended, cjkStroke, katakanaPhoneticExtension, enclosedCJKLetterOrMonth, cjkCompatibility, cjkUnifiedIdeographExtensionA, yijingHexagramSymbol, cjkUnifiedIdeograph, yiSyllable, yiRadical, lisu, vai, cyrillicExtendedB, bamum, modifierToneLetter, latinExtendedD, sylotiNagri, commonIndicNumberForm, phagsPa, saurashtra, devanagariExtended, kayahLi, rejang, hangulJamoExtendedA, javanese, cham, myanmarExtendedA, taiViet, meeteiMayekExtension, ethiopicExtendedA, meeteiMayek, hangulSyllable, hangulJamoExtendedB, highSurrogate, highPrivateUseSurrogate, lowSurrogate, privateUseArea, cjkCompatibilityIdeograph, alphabeticPresentationForm, arabicPresentationFormA, variationSelector, verticalForm, combiningHalfMark, cjkCompatibilityForm, smallFormVariant, arabicPresentationFormB, halfwidthOrFullwidthForm, special, linearBSyllable, linearBIdeogram, aegeanNumber, ancientGreekNumber, ancientSymbol, phaistosDisc, lycian, carian, oldItalic, gothic, ugaritic, oldPersian, deseret, shavian, osmanya, cypriotSyllable, imperialAramaic, phoenician, lydian, meroiticHieroglyph, meroiticCursive, kharoshthi, oldSouthArabian, avestan, inscriptionalParthian, inscriptionalPahlavi, oldTurkic, rumiNumericalSymbol, brahmi, kaithi, soraSompeng, chakma, sharada, takri, cuneiform, cuneiformNumberOrPunctuation, egyptianHieroglyph, bamumSupplement, miao, kanaSupplement, byzantineMusicalSymbol, musicalSymbol, ancientGreekMusicalNotationSymbol, taiXuanJingSymbol, countingRodNumeral, mathematicalAlphanumericSymbol, arabicMathematicalAlphabeticSymbol, mahjongTile, dominoTile, playingCard, enclosedAlphanumericSupplement, enclosedIdeographicSupplement, miscellaneousSymbolOrPictograph, emoticon, transportOrMapSymbol, alchemicalSymbol, cjkUnifiedIdeographExtensionB, cjkUnifiedIdeographExtensionC, cjkUnifiedIdeographExtensionD, cjkCompatibilityIdeographSupplement, tag, variationSelectorSupplement, supplementaryPrivateUseAreaA, supplementaryPrivateUseAreaB

-}

import Char         exposing (fromCode)
import Random       exposing (Generator, int)
import Random.Extra exposing (map, merge)

{-| Generate a random character within a certain keyCode range

    lowerCaseLetter = char 65 90
-}
char : Int -> Int -> Generator Char
char start end =
  map fromCode (int start end)

{-| Generate a random upper-case Latin Letter
-}
upperCaseLatin : Generator Char
upperCaseLatin =
  char 65 90

{-| Generate a random lower-case Latin Letter
-}
lowerCaseLatin : Generator Char
lowerCaseLatin =
  char 97 122

{-| Generate a random Latin Letter
-}
latin : Generator Char
latin =
  merge lowerCaseLatin upperCaseLatin

{-| Generate a random English Letter (alias for `latin`)
-}
english : Generator Char
english =
  latin

{-| Generate a random ASCII Character
-}
ascii : Generator Char
ascii =
  char 0 127

{-| Generate a random Character in the valid unicode range.
Note: This can produce garbage values as unicode doesn't use all valid values.
To test for specific languages and character sets, use the appropriate one
from the list.
-}
unicode : Generator Char
unicode =
  char 0 1114111

{-| UTF-8 -}
basicLatin : Generator Char
basicLatin =
  char 0 127

{-|-}
latin1Supplement : Generator Char
latin1Supplement =
  char 128 255

{-|-}
latinExtendedA : Generator Char
latinExtendedA =
  char 256 383

{-|-}
latinExtendedB : Generator Char
latinExtendedB =
  char 384 591

{-|-}
ipaExtensions : Generator Char
ipaExtensions =
  char 592 687

{-|-}
spacingModifier : Generator Char
spacingModifier =
  char 688 767

{-|-}
combiningDiacriticalMarks : Generator Char
combiningDiacriticalMarks =
  char 768 879

{-|-}
greekAndCoptic : Generator Char
greekAndCoptic =
  char 880 1023

{-|-}
cyrillic : Generator Char
cyrillic =
  char 1024 1279

{-|-}
cyrillicSupplement : Generator Char
cyrillicSupplement =
  char 1280 1327

{-|-}
armenian : Generator Char
armenian =
  char 1328 1423

{-|-}
hebrew : Generator Char
hebrew =
  char 1424 1535

{-|-}
arabic : Generator Char
arabic =
  char 1536 1791

{-|-}
syriac : Generator Char
syriac =
  char 1792 1871

{-|-}
arabicSupplement : Generator Char
arabicSupplement =
  char 1872 1919

{-|-}
thaana : Generator Char
thaana =
  char 1920 1983

{-|-}
nko : Generator Char
nko =
  char 1984 2047

{-|-}
samaritan : Generator Char
samaritan =
  char 2048 2111

{-|-}
mandaic : Generator Char
mandaic =
  char 2112 2143

{-|-}
arabicExtendedA : Generator Char
arabicExtendedA =
  char 2208 2303

{-|-}
devanagari : Generator Char
devanagari =
  char 2304 2431

{-|-}
bengali : Generator Char
bengali =
  char 2432 2559

{-|-}
gurmukhi : Generator Char
gurmukhi =
  char 2560 2687

{-|-}
gujarati : Generator Char
gujarati =
  char 2688 2815

{-|-}
oriya : Generator Char
oriya =
  char 2816 2943

{-|-}
tamil : Generator Char
tamil =
  char 2944 3071

{-|-}
telugu : Generator Char
telugu =
  char 3072 3199

{-|-}
kannada : Generator Char
kannada =
  char 3200 3327

{-|-}
malayalam : Generator Char
malayalam =
  char 3328 3455

{-|-}
sinhala : Generator Char
sinhala =
  char 3456 3583

{-|-}
thai : Generator Char
thai =
  char 3584 3711

{-|-}
lao : Generator Char
lao =
  char 3712 3839

{-|-}
tibetan : Generator Char
tibetan =
  char 3840 4095

{-|-}
myanmar : Generator Char
myanmar =
  char 4096 4255

{-|-}
georgian : Generator Char
georgian =
  char 4256 4351

{-|-}
hangulJamo : Generator Char
hangulJamo =
  char 4352 4607

{-|-}
ethiopic : Generator Char
ethiopic =
  char 4608 4991

{-|-}
ethiopicSupplement : Generator Char
ethiopicSupplement =
  char 4992 5023

{-|-}
cherokee : Generator Char
cherokee =
  char 5024 5119

{-|-}
unifiedCanadianAboriginalSyllabic : Generator Char
unifiedCanadianAboriginalSyllabic =
  char 5120 5759

{-|-}
ogham : Generator Char
ogham =
  char 5760 5791

{-|-}
runic : Generator Char
runic =
  char 5792 5887

{-|-}
tagalog : Generator Char
tagalog =
  char 5888 5919

{-|-}
hanunoo : Generator Char
hanunoo =
  char 5920 5951

{-|-}
buhid : Generator Char
buhid =
  char 5952 5983

{-|-}
tagbanwa : Generator Char
tagbanwa =
  char 5984 6015

{-|-}
khmer : Generator Char
khmer =
  char 6016 6143

{-|-}
mongolian : Generator Char
mongolian =
  char 6144 6319

{-|-}
unifiedCanadianAboriginalSyllabicExtended : Generator Char
unifiedCanadianAboriginalSyllabicExtended =
  char 6320 6399

{-|-}
limbu : Generator Char
limbu =
  char 6400 6479

{-|-}
taiLe : Generator Char
taiLe =
  char 6480 6527

{-|-}
newTaiLue : Generator Char
newTaiLue =
  char 6528 6623

{-|-}
khmerSymbol : Generator Char
khmerSymbol =
  char 6624 6655

{-|-}
buginese : Generator Char
buginese =
  char 6656 6687

{-|-}
taiTham : Generator Char
taiTham =
  char 6688 6831

{-|-}
balinese : Generator Char
balinese =
  char 6912 7039

{-|-}
sundanese : Generator Char
sundanese =
  char 7040 7103

{-|-}
batak : Generator Char
batak =
  char 7104 7167

{-|-}
lepcha : Generator Char
lepcha =
  char 7168 7247

{-|-}
olChiki : Generator Char
olChiki =
  char 7248 7295

{-|-}
sundaneseSupplement : Generator Char
sundaneseSupplement =
  char 7360 7375

{-|-}
vedicExtensions : Generator Char
vedicExtensions =
  char 7376 7423

{-|-}
phoneticExtensions : Generator Char
phoneticExtensions =
  char 7424 7551

{-|-}
phoneticExtensionsSupplement : Generator Char
phoneticExtensionsSupplement =
  char 7552 7615

{-|-}
combiningDiacriticalMarksSupplement : Generator Char
combiningDiacriticalMarksSupplement =
  char 7616 7679

{-|-}
latinExtendedAdditional : Generator Char
latinExtendedAdditional =
  char 7680 7935

{-|-}
greekExtended : Generator Char
greekExtended =
  char 7936 8191

{-|-}
generalPunctuation : Generator Char
generalPunctuation =
  char 8192 8303

{-|-}
superscriptOrSubscript : Generator Char
superscriptOrSubscript =
  char 8304 8351

{-|-}
currencySymbol : Generator Char
currencySymbol =
  char 8352 8399

{-|-}
combiningDiacriticalMarksForSymbols : Generator Char
combiningDiacriticalMarksForSymbols =
  char 8400 8447

{-|-}
letterlikeSymbol : Generator Char
letterlikeSymbol =
  char 8448 8527

{-|-}
numberForm : Generator Char
numberForm =
  char 8528 8591

{-|-}
arrow : Generator Char
arrow =
  char 8592 8703

{-|-}
mathematicalOperator : Generator Char
mathematicalOperator =
  char 8704 8959

{-|-}
miscellaneousTechnical : Generator Char
miscellaneousTechnical =
  char 8960 9215

{-|-}
controlPicture : Generator Char
controlPicture =
  char 9216 9279

{-|-}
opticalCharacterRecognition : Generator Char
opticalCharacterRecognition =
  char 9280 9311

{-|-}
enclosedAlphanumeric : Generator Char
enclosedAlphanumeric =
  char 9312 9471

{-|-}
boxDrawing : Generator Char
boxDrawing =
  char 9472 9599

{-|-}
blockElement : Generator Char
blockElement =
  char 9600 9631

{-|-}
geometricShape : Generator Char
geometricShape =
  char 9632 9727

{-|-}
miscellaneousSymbol : Generator Char
miscellaneousSymbol =
  char 9728 9983

{-|-}
dingbat : Generator Char
dingbat =
  char 9984 10175

{-|-}
miscellaneousMathematicalSymbolA : Generator Char
miscellaneousMathematicalSymbolA =
  char 10176 10223

{-|-}
supplementalArrowA : Generator Char
supplementalArrowA =
  char 10224 10239

{-|-}
braillePattern : Generator Char
braillePattern =
  char 10240 10495

{-|-}
supplementalArrowB : Generator Char
supplementalArrowB =
  char 10496 10623

{-|-}
miscellaneousMathematicalSymbolB : Generator Char
miscellaneousMathematicalSymbolB =
  char 10624 10751

{-|-}
supplementalMathematicalOperator : Generator Char
supplementalMathematicalOperator =
  char 10752 11007

{-|-}
miscellaneousSymbolOrArrow : Generator Char
miscellaneousSymbolOrArrow =
  char 11008 11263

{-|-}
glagolitic : Generator Char
glagolitic =
  char 11264 11359

{-|-}
latinExtendedC : Generator Char
latinExtendedC =
  char 11360 11391

{-|-}
coptic : Generator Char
coptic =
  char 11392 11519

{-|-}
georgianSupplement : Generator Char
georgianSupplement =
  char 11520 11567

{-|-}
tifinagh : Generator Char
tifinagh =
  char 11568 11647

{-|-}
ethiopicExtended : Generator Char
ethiopicExtended =
  char 11648 11743

{-|-}
cyrillicExtendedA : Generator Char
cyrillicExtendedA =
  char 11744 11775

{-|-}
supplementalPunctuation : Generator Char
supplementalPunctuation =
  char 11776 11903

{-|-}
cjkRadicalSupplement : Generator Char
cjkRadicalSupplement =
  char 11904 12031

{-|-}
kangxiRadical : Generator Char
kangxiRadical =
  char 12032 12255

{-|-}
ideographicDescription : Generator Char
ideographicDescription =
  char 12272 12287

{-|-}
cjkSymbolOrPunctuation : Generator Char
cjkSymbolOrPunctuation =
  char 12288 12351

{-|-}
hiragana : Generator Char
hiragana =
  char 12352 12447

{-|-}
katakana : Generator Char
katakana =
  char 12448 12543

{-|-}
bopomofo : Generator Char
bopomofo =
  char 12544 12591

{-|-}
hangulCompatibilityJamo : Generator Char
hangulCompatibilityJamo =
  char 12592 12687

{-|-}
kanbun : Generator Char
kanbun =
  char 12688 12703

{-|-}
bopomofoExtended : Generator Char
bopomofoExtended =
  char 12704 12735

{-|-}
cjkStroke : Generator Char
cjkStroke =
  char 12736 12783

{-|-}
katakanaPhoneticExtension : Generator Char
katakanaPhoneticExtension =
  char 12784 12799

{-|-}
enclosedCJKLetterOrMonth : Generator Char
enclosedCJKLetterOrMonth =
  char 12800 13055

{-|-}
cjkCompatibility : Generator Char
cjkCompatibility =
  char 13056 13311

{-|-}
cjkUnifiedIdeographExtensionA : Generator Char
cjkUnifiedIdeographExtensionA =
  char 13312 19903

{-|-}
yijingHexagramSymbol : Generator Char
yijingHexagramSymbol =
  char 19904 19967

{-|-}
cjkUnifiedIdeograph : Generator Char
cjkUnifiedIdeograph =
  char 19968 40959

{-|-}
yiSyllable : Generator Char
yiSyllable =
  char 40960 42127

{-|-}
yiRadical : Generator Char
yiRadical =
  char 42128 42191

{-|-}
lisu : Generator Char
lisu =
  char 42192 42239

{-|-}
vai : Generator Char
vai =
  char 42240 42559

{-|-}
cyrillicExtendedB : Generator Char
cyrillicExtendedB =
  char 42560 42655

{-|-}
bamum : Generator Char
bamum =
  char 42656 42751

{-|-}
modifierToneLetter : Generator Char
modifierToneLetter =
  char 42752 42783

{-|-}
latinExtendedD : Generator Char
latinExtendedD =
  char 42784 43007

{-|-}
sylotiNagri : Generator Char
sylotiNagri =
  char 43008 43055

{-|-}
commonIndicNumberForm : Generator Char
commonIndicNumberForm =
  char 43056 43071

{-|-}
phagsPa : Generator Char
phagsPa =
  char 43072 43135

{-|-}
saurashtra : Generator Char
saurashtra =
  char 43136 43231

{-|-}
devanagariExtended : Generator Char
devanagariExtended =
  char 43232 43263

{-|-}
kayahLi : Generator Char
kayahLi =
  char 43264 43311

{-|-}
rejang : Generator Char
rejang =
  char 43312 43359

{-|-}
hangulJamoExtendedA : Generator Char
hangulJamoExtendedA =
  char 43360 43391

{-|-}
javanese : Generator Char
javanese =
  char 43392 43487

{-|-}
cham : Generator Char
cham =
  char 43520 43615

{-|-}
myanmarExtendedA : Generator Char
myanmarExtendedA =
  char 43616 43647

{-|-}
taiViet : Generator Char
taiViet =
  char 43648 43743

{-|-}
meeteiMayekExtension : Generator Char
meeteiMayekExtension =
  char 43744 43775

{-|-}
ethiopicExtendedA : Generator Char
ethiopicExtendedA =
  char 43776 43823

{-|-}
meeteiMayek : Generator Char
meeteiMayek =
  char 43968 44031

{-|-}
hangulSyllable : Generator Char
hangulSyllable =
  char 44032 55215

{-|-}
hangulJamoExtendedB : Generator Char
hangulJamoExtendedB =
  char 55216 55295

{-|-}
highSurrogate : Generator Char
highSurrogate =
  char 55296 56191

{-|-}
highPrivateUseSurrogate : Generator Char
highPrivateUseSurrogate =
  char 56192 56319

{-|-}
lowSurrogate : Generator Char
lowSurrogate =
  char 56320 57343

{-|-}
privateUseArea : Generator Char
privateUseArea =
  char 57344 63743

{-|-}
cjkCompatibilityIdeograph : Generator Char
cjkCompatibilityIdeograph =
  char 63744 64255

{-|-}
alphabeticPresentationForm : Generator Char
alphabeticPresentationForm =
  char 64256 64335

{-|-}
arabicPresentationFormA : Generator Char
arabicPresentationFormA =
  char 64336 65023

{-|-}
variationSelector : Generator Char
variationSelector =
  char 65024 65039

{-|-}
verticalForm : Generator Char
verticalForm =
  char 65040 65055

{-|-}
combiningHalfMark : Generator Char
combiningHalfMark =
  char 65056 65071

{-|-}
cjkCompatibilityForm : Generator Char
cjkCompatibilityForm =
  char 65072 65103

{-|-}
smallFormVariant : Generator Char
smallFormVariant =
  char 65104 65135

{-|-}
arabicPresentationFormB : Generator Char
arabicPresentationFormB =
  char 65136 65279

{-|-}
halfwidthOrFullwidthForm : Generator Char
halfwidthOrFullwidthForm =
  char 65280 65519

{-|-}
special : Generator Char
special =
  char 65520 65535

{-|-}
linearBSyllable : Generator Char
linearBSyllable =
  char 65536 65663

{-|-}
linearBIdeogram : Generator Char
linearBIdeogram =
  char 65664 65791

{-|-}
aegeanNumber : Generator Char
aegeanNumber =
  char 65792 65855

{-|-}
ancientGreekNumber : Generator Char
ancientGreekNumber =
  char 65856 65935

{-|-}
ancientSymbol : Generator Char
ancientSymbol =
  char 65936 65999

{-|-}
phaistosDisc : Generator Char
phaistosDisc =
  char 66000 66047

{-|-}
lycian : Generator Char
lycian =
  char 66176 66207

{-|-}
carian : Generator Char
carian =
  char 66208 66271

{-|-}
oldItalic : Generator Char
oldItalic =
  char 66304 66351

{-|-}
gothic : Generator Char
gothic =
  char 66352 66383

{-|-}
ugaritic : Generator Char
ugaritic =
  char 66432 66463

{-|-}
oldPersian : Generator Char
oldPersian =
  char 66464 66527

{-|-}
deseret : Generator Char
deseret =
  char 66560 66639

{-|-}
shavian : Generator Char
shavian =
  char 66640 66687

{-|-}
osmanya : Generator Char
osmanya =
  char 66688 66735

{-|-}
cypriotSyllable : Generator Char
cypriotSyllable =
  char 67584 67647

{-|-}
imperialAramaic : Generator Char
imperialAramaic =
  char 67648 67679

{-|-}
phoenician : Generator Char
phoenician =
  char 67840 67871

{-|-}
lydian : Generator Char
lydian =
  char 67872 67903

{-|-}
meroiticHieroglyph : Generator Char
meroiticHieroglyph =
  char 67968 67999

{-|-}
meroiticCursive : Generator Char
meroiticCursive =
  char 68000 68095

{-|-}
kharoshthi : Generator Char
kharoshthi =
  char 68096 68191

{-|-}
oldSouthArabian : Generator Char
oldSouthArabian =
  char 68192 68223

{-|-}
avestan : Generator Char
avestan =
  char 68352 68415

{-|-}
inscriptionalParthian : Generator Char
inscriptionalParthian =
  char 68416 68447

{-|-}
inscriptionalPahlavi : Generator Char
inscriptionalPahlavi =
  char 68448 68479

{-|-}
oldTurkic : Generator Char
oldTurkic =
  char 68608 68687

{-|-}
rumiNumericalSymbol : Generator Char
rumiNumericalSymbol =
  char 69216 69247

{-|-}
brahmi : Generator Char
brahmi =
  char 69632 69759

{-|-}
kaithi : Generator Char
kaithi =
  char 69760 69839

{-|-}
soraSompeng : Generator Char
soraSompeng =
  char 69840 69887

{-|-}
chakma : Generator Char
chakma =
  char 69888 69967

{-|-}
sharada : Generator Char
sharada =
  char 70016 70111

{-|-}
takri : Generator Char
takri =
  char 71296 71375

{-|-}
cuneiform : Generator Char
cuneiform =
  char 73728 74751

{-|-}
cuneiformNumberOrPunctuation : Generator Char
cuneiformNumberOrPunctuation =
  char 74752 74879

{-|-}
egyptianHieroglyph : Generator Char
egyptianHieroglyph =
  char 77824 78895

{-|-}
bamumSupplement : Generator Char
bamumSupplement =
  char 92160 92735

{-|-}
miao : Generator Char
miao =
  char 93952 94111

{-|-}
kanaSupplement : Generator Char
kanaSupplement =
  char 110592 110847

{-|-}
byzantineMusicalSymbol : Generator Char
byzantineMusicalSymbol =
  char 118784 119039

{-|-}
musicalSymbol : Generator Char
musicalSymbol =
  char 119040 119295

{-|-}
ancientGreekMusicalNotationSymbol : Generator Char
ancientGreekMusicalNotationSymbol =
  char 119296 119375

{-|-}
taiXuanJingSymbol : Generator Char
taiXuanJingSymbol =
  char 119552 119647

{-|-}
countingRodNumeral : Generator Char
countingRodNumeral =
  char 119648 119679

{-|-}
mathematicalAlphanumericSymbol : Generator Char
mathematicalAlphanumericSymbol =
  char 119808 120831

{-|-}
arabicMathematicalAlphabeticSymbol : Generator Char
arabicMathematicalAlphabeticSymbol =
  char 126464 126719

{-|-}
mahjongTile : Generator Char
mahjongTile =
  char 126976 127023

{-|-}
dominoTile : Generator Char
dominoTile =
  char 127024 127135

{-|-}
playingCard : Generator Char
playingCard =
  char 127136 127231

{-|-}
enclosedAlphanumericSupplement : Generator Char
enclosedAlphanumericSupplement =
  char 127232 127487

{-|-}
enclosedIdeographicSupplement : Generator Char
enclosedIdeographicSupplement =
  char 127488 127743

{-|-}
miscellaneousSymbolOrPictograph : Generator Char
miscellaneousSymbolOrPictograph =
  char 127744 128511

{-|-}
emoticon : Generator Char
emoticon =
  char 128512 128591

{-|-}
transportOrMapSymbol : Generator Char
transportOrMapSymbol =
  char 128640 128767

{-|-}
alchemicalSymbol : Generator Char
alchemicalSymbol =
  char 128768 128895

{-|-}
cjkUnifiedIdeographExtensionB : Generator Char
cjkUnifiedIdeographExtensionB =
  char 131072 173791

{-|-}
cjkUnifiedIdeographExtensionC : Generator Char
cjkUnifiedIdeographExtensionC =
  char 173824 177983

{-|-}
cjkUnifiedIdeographExtensionD : Generator Char
cjkUnifiedIdeographExtensionD =
  char 177984 178207

{-|-}
cjkCompatibilityIdeographSupplement : Generator Char
cjkCompatibilityIdeographSupplement =
  char 194560 195103

{-|-}
tag : Generator Char
tag =
  char 917504 917631

{-|-}
variationSelectorSupplement : Generator Char
variationSelectorSupplement =
  char 917760 917999

{-|-}
supplementaryPrivateUseAreaA : Generator Char
supplementaryPrivateUseAreaA =
  char 983040 1048575

{-|-}
supplementaryPrivateUseAreaB : Generator Char
supplementaryPrivateUseAreaB =
  char 1048576 1114111
