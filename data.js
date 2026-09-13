const ELEMENTS = [
  {
    symbol: "H",
    nameRu: "Водород",
    nameLat: "Hydrogenium",
    pronunciation: "аш",
    valence: "I (−1, +1)",
    category: "nonmetal",
    atomicNumber: 1
  },
  {
    symbol: "Li",
    nameRu: "Литий",
    nameLat: "Lithium",
    pronunciation: "литий",
    valence: "I",
    category: "alkali",
    atomicNumber: 3
  },
  {
    symbol: "Na",
    nameRu: "Натрий",
    nameLat: "Natrium",
    pronunciation: "натрий",
    valence: "I",
    category: "alkali",
    atomicNumber: 11
  },
  {
    symbol: "K",
    nameRu: "Калий",
    nameLat: "Kalium",
    pronunciation: "калий",
    valence: "I",
    category: "alkali",
    atomicNumber: 19
  },
  {
    symbol: "Rb",
    nameRu: "Рубидий",
    nameLat: "Rubidium",
    pronunciation: "рубидий",
    valence: "I",
    category: "alkali",
    atomicNumber: 37
  },
  {
    symbol: "Cs",
    nameRu: "Цезий",
    nameLat: "Caesium",
    pronunciation: "цезий",
    valence: "I",
    category: "alkali",
    atomicNumber: 55
  },
  {
    symbol: "Mg",
    nameRu: "Магний",
    nameLat: "Magnesium",
    pronunciation: "магний",
    valence: "II",
    category: "alkaline-earth",
    atomicNumber: 12
  },
  {
    symbol: "Ca",
    nameRu: "Кальций",
    nameLat: "Calcium",
    pronunciation: "кальций",
    valence: "II",
    category: "alkaline-earth",
    atomicNumber: 20
  },
  {
    symbol: "Sr",
    nameRu: "Стронций",
    nameLat: "Strontium",
    pronunciation: "стронций",
    valence: "II",
    category: "alkaline-earth",
    atomicNumber: 38
  },
  {
    symbol: "Ba",
    nameRu: "Барий",
    nameLat: "Barium",
    pronunciation: "барий",
    valence: "II",
    category: "alkaline-earth",
    atomicNumber: 56
  },
  {
    symbol: "Al",
    nameRu: "Алюминий",
    nameLat: "Aluminium",
    pronunciation: "алюминий",
    valence: "III",
    category: "post-transition",
    atomicNumber: 13
  },
  {
    symbol: "C",
    nameRu: "Углерод",
    nameLat: "Carboneum",
    pronunciation: "це",
    valence: "II, IV",
    category: "nonmetal",
    atomicNumber: 6
  },
  {
    symbol: "Si",
    nameRu: "Кремний",
    nameLat: "Silicium",
    pronunciation: "силициум",
    valence: "II, IV",
    category: "metalloid",
    atomicNumber: 14
  },
  {
    symbol: "Pb",
    nameRu: "Свинец",
    nameLat: "Plumbum",
    pronunciation: "плюмбум",
    valence: "II, IV",
    category: "post-transition",
    atomicNumber: 82
  },
  {
    symbol: "Sn",
    nameRu: "Олово",
    nameLat: "Stannum",
    pronunciation: "станнум",
    valence: "II, IV",
    category: "post-transition",
    atomicNumber: 50
  },
  {
    symbol: "N",
    nameRu: "Азот",
    nameLat: "Nitrogenium",
    pronunciation: "эн",
    valence: "III, V (−3…+5)",
    category: "nonmetal",
    atomicNumber: 7
  },
  {
    symbol: "P",
    nameRu: "Фосфор",
    nameLat: "Phosphorus",
    pronunciation: "пэ",
    valence: "III, V",
    category: "nonmetal",
    atomicNumber: 15
  },
  {
    symbol: "O",
    nameRu: "Кислород",
    nameLat: "Oxygenium",
    pronunciation: "о",
    valence: "II",
    category: "nonmetal",
    atomicNumber: 8
  },
  {
    symbol: "S",
    nameRu: "Сера",
    nameLat: "Sulfur",
    pronunciation: "эс",
    valence: "II, IV, VI",
    category: "nonmetal",
    atomicNumber: 16
  },
  {
    symbol: "F",
    nameRu: "Фтор",
    nameLat: "Fluorum",
    pronunciation: "фтор",
    valence: "I",
    category: "halogen",
    atomicNumber: 9
  },
  {
    symbol: "Cl",
    nameRu: "Хлор",
    nameLat: "Chlorum",
    pronunciation: "хлор",
    valence: "I, III, V, VII",
    category: "halogen",
    atomicNumber: 17
  },
  {
    symbol: "Br",
    nameRu: "Бром",
    nameLat: "Bromum",
    pronunciation: "бром",
    valence: "I, III, V, VII",
    category: "halogen",
    atomicNumber: 35
  },
  {
    symbol: "I",
    nameRu: "Йод",
    nameLat: "Iodum",
    pronunciation: "йод",
    valence: "I, III, V, VII",
    category: "halogen",
    atomicNumber: 53
  },
  {
    symbol: "Au",
    nameRu: "Золото",
    nameLat: "Aurum",
    pronunciation: "аурум",
    valence: "I, III",
    category: "transition",
    atomicNumber: 79
  },
  {
    symbol: "Ag",
    nameRu: "Серебро",
    nameLat: "Argentum",
    pronunciation: "аргентум",
    valence: "I",
    category: "transition",
    atomicNumber: 47
  },
  {
    symbol: "Cu",
    nameRu: "Медь",
    nameLat: "Cuprum",
    pronunciation: "купрум",
    valence: "I, II",
    category: "transition",
    atomicNumber: 29
  },
  {
    symbol: "Zn",
    nameRu: "Цинк",
    nameLat: "Zincum",
    pronunciation: "цинк",
    valence: "II",
    category: "transition",
    atomicNumber: 30
  },
  {
    symbol: "Hg",
    nameRu: "Ртуть",
    nameLat: "Hydrargyrum",
    pronunciation: "гидраргирум",
    valence: "I, II",
    category: "transition",
    atomicNumber: 80
  },
  {
    symbol: "Fe",
    nameRu: "Железо",
    nameLat: "Ferrum",
    pronunciation: "феррум",
    valence: "II, III",
    category: "transition",
    atomicNumber: 26
  }
];

const CATEGORY_LABELS = {
  alkali: "Щелочные металлы",
  "alkaline-earth": "Щёлочноземельные металлы",
  transition: "Переходные металлы",
  "post-transition": "Постпереходные металлы",
  nonmetal: "Неметаллы",
  halogen: "Галогены",
  metalloid: "Металлоиды"
};
