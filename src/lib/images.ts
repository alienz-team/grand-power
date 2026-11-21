// Curated, manually vetted Unsplash library — machines only, ZERO humans.
// Every ID below was visually checked. Do not add photos containing people, faces, riders or hands.

export const u = (id: string, w = 1800) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=85`;

export const IMG = {
  // Hero / showroom
  studioSupercar: u("1617788138017-80ad40651399"),
  suvGrille: u("1606664515524-ed2f786a0bd6"),
  ducatiTunnel: u("1615172282427-9a57ef2d142e"),
  offroadBuggy: u("1724414544014-3728aad0b45e"),
  electricMotor: u("1558981403-c5f9899a28bc"),
  whiteRoadBike: u("1485965120184-e220f721d03e"),
  darkGtrRear: u("1611859266238-4b98091d9d9b"),

  // Cars
  rangeRover: u("1563720223185-11003d516935"),
  gClass: u("1520031441872-265e4ff70366"),
  gt3Black: u("1580274455191-1c62238fa333"),
  porsche911Black: u("1611821064430-0d40291d0f0b"),
  porsche911White: u("1614162692292-7ac56d7f7f1e"),
  panamera: u("1503376780353-7e6692767b70"),
  amgGtGold: u("1618843479313-40f8afb4b4d8"),
  amgGtRed: u("1553440569-bcc63803a83d"),
  amgGtYellow: u("1605559424843-9e4c228bf1c2"),
  amgGtSilver: u("1616788494707-ec28f08d05a1"),
  amgHood: u("1514316454349-750a7fd3da3a"),
  mercGarage: u("1590362891991-f776e747a588"),
  bmwM4: u("1580273916550-e323be2ae537"),
  bmwM4Red: u("1617531653332-bd46c24f2068"),
  bmwM5: u("1555215695-3004980ad54e"),
  bmwM2: u("1603386329225-868f9b1ee6c9"),
  audiRs6: u("1606664515524-ed2f786a0bd6"),
  audiR8: u("1626847037657-fd3622613ce3"),
  audiQ7: u("1517524008697-84bbe3c3fd98"),
  mustangDark: u("1494976388531-d1058494cdd8"),
  mustangRed: u("1597404294360-feeeda04612e"),
  camaro: u("1492144534655-ae79c964c9d7"),
  camaroBlue: u("1552519507-da3b142c6e3d"),
  huracanWhite: u("1544829099-b9a0c07fad1a"),
  huracanOrange: u("1612825173281-9a193378527e"),
  aventador: u("1525609004556-c46c7d6cf023"),
  lamboBlue: u("1621135802920-133df287f89c"),
  mclaren: u("1542362567-b07e54358753"),
  ferrari: u("1583121274602-3e2820c69888"),
  chiron: u("1544636331-e26879cd4d9b"),
  gtrRoad: u("1568605117036-5fe5e7bab0b7"),
  mercDark: u("1617814076367-b759c7d7e738"),
  sedanSilhouette: u("1485291571150-772bcfc10da5"),
  challenger: u("1626668893632-6f3a4466d22f"),
  interior: u("1610647752706-3bb12232b3ab"),
  teslaY: u("1600661653561-629509216228"),

  // Motors
  ktmRc: u("1449426468159-d96dbf08f19f"),
  yamahaR: u("1609630875171-b1321377ee65"),
  dukeNaked: u("1591637333184-19aa84b3e01f"),
  classicBike: u("1622185135505-2d795003994a"),
  ninjaRace: u("1580310614729-ccd69652491d"),
  r6Blue: u("1547549082-6bc09f2049ae"),
  ninjaGreen: u("1599819811279-d5ad9cccf838"),
  redSportNight: u("1517846693594-1567da72af75"),
  redSportStudio: u("1568772585407-9361f9bf3a87"),
  harleyBlack: u("1558981285-6f0c94958bb6"),

  // Bicycles
  blackRoadBike: u("1532298229144-0ec0c57515c7"),
  gravelBike: u("1576435728678-68d0fbf94e91"),
  fixieOrange: u("1507035895480-2b3156c31fc8"),
  fixieWhite: u("1571068316344-75bc76f77890"),
  fixieGrey: u("1559348349-86f1f65817fe"),
  trackBike: u("1593764592116-bfb2a97c642a"),
  mtbStreet: u("1529422643029-d4585747aaf2"),
  bikepacking: u("1511994298241-608e28f14fde"),

  // Libyan-market showroom & used vehicles (vetted 2026-11: no people)
  landCruiser200: u("1491422433900-4e19887b7b21"),
  landCruiser70: u("1500381369072-1e8259ca5ed4"),
  pradoRear: u("1692985973827-62dfc31ef012"),
  patrolY62: u("1650453598094-1a430cdd8f80"),
  camryGrey: u("1621007947382-bb3c3994e3fb"),
  yarisSedanRear: u("1749058983952-c7ce95258535"),
  yarisSedanFront: u("1749058983469-11eaef8d7bc5"),
  corollaWhite: u("1623869675781-80aa31012a5a"),
  tucsonShowroom: u("1706082072635-d19df8f0f3fb"),
  tucsonBlack: u("1575090536203-2a6193126514"),
  sportageRear: u("1654689289571-07f69459ae35"),
  hiluxSilver: u("1631377875413-b1e3e660bfa2"),
  hiluxClassic: u("1768467485572-ea7e8ebe921e"),
  tacomaTan: u("1559416523-140ddc3d238c"),
  tacomaBlack: u("1641333326784-24a9c21d3c4e"),
  usedCarLot: u("1772440223098-cc23f6f01209"),

  // Services: mobile workshop · car wash · car editing (no people, no hands)
  engineBayClean: u("1725289339928-06ee31684df5"),
  engineBayV8: u("1723908920564-55f3b9507f6c"),
  toolsWrenches: u("1637640125496-31852f042a60"),
  toolboxWorkshop: u("1640682841767-cdfce3aea6e0"),
  dashDiagnostics: u("1758411898007-6a17c74ef528"),
  washFoamGrey: u("1781890424630-ea9e1f931f08"),
  washFoamBlack: u("1781890358868-a21b8b87acde"),
  washFoamWheel: u("1781890315497-922d5b84fefa"),
  washFoamFront: u("1781890290050-4138ef5afc97"),
  tunedWidebody: u("1750712348122-e0c0998e3ff2"),

  // Accessories / parts
  engineBelts: u("1486262715619-67b85e0b08d3"),
  motoWheelBrake: u("1558980394-4c7c9299fe96"),
  headlightEngine: u("1606577924006-27d39b132ae2"),
  chironFront: u("1600712242805-5f78671b24da"),
} as const;

/** Hosts allowed by next.config images.remotePatterns — keep in sync. */
export function isAllowedImageUrl(src: string): boolean {
  try {
    const u = new URL(src);
    return (
      u.protocol === "https:" &&
      (u.hostname === "images.unsplash.com" || u.hostname === "images.cdn-files-a.com" || u.hostname.endsWith(".supabase.co"))
    );
  } catch {
    return false;
  }
}
