# Country geography metadata

Source: [mledoze/countries](https://github.com/mledoze/countries), downloaded from
[countries.json](https://raw.githubusercontent.com/mledoze/countries/master/countries.json)
on 2026-10-10 UTC. This is a local snapshot, with no runtime network dependency.

country-metadata.json is a reduced derivative retaining cca2, ccn3, common English
name, region, subregion, flag and latlng. Other upstream fields were removed.
The extract and generated countryCatalog.ts metadata are available under
[ODbL-1.0](country-metadata-LICENSE.txt). Attribution also appears in the app footer.

Run npm run data:build to join metadata to the actual Passport Index country IDs.
Only IDs present in that mobility snapshot become selectable. Numeric IDs connect
World Atlas polygons; Kosovo's missing numeric ID uses its explicit feature name.
Countries without coarse-map polygons use longitude/latitude point markers.
These are approximate geographic markers, not borders or travel destinations at
street-level precision. Regions group metadata and do not determine access.

Country metadata contains no entry requirements and does not verify the separate
Passport Index snapshot. Updating geography never renews visa source dates.
