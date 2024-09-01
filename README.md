# Bus Timetable web app

A quasar web app for displaying routes, timetables and tracking buses.


## Environment setup

### Install the dependencies

```bash
yarn
# or
npm install
```

### Start the app in development mode

> [!NOTE]
> With developer mode you get access to:\
> hot reloading, error reporting and some other tools on the **'/dev'** page

```bash
yarn dev
# or
npm run dev
```

> [!TIP]
> To create an environment that only contains the **bus tracker** add `tracker` as the last argument.\
> Example:
> ```bash
> npm run dev tracker
> ```
> This should also work when building the application

## Building

### Create build

```bash
yarn build
# or
npm run build
```

### Run the build

```bash
yarn prod
# or
npm run prod
```

### Customize quasar configuration

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).
