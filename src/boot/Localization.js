import { watchEffect } from 'vue'
import { createI18n } from 'vue-i18n'
import { Lang, LocalStorage } from 'quasar'
import messages from 'src/locales'

export default ({ app }) => {
  const i18n = createI18n({
    locale: 'en-US',
    legacy: false,
    messages
  })

  const userLocale = LocalStorage.getItem('Language') || Lang.getLocale()
  if (messages[userLocale]) { i18n.global.locale.value = userLocale }

  watchEffect(() => {
    const lang = i18n.global.locale.value
    if (lang !== Lang.getLocale()) {
      LocalStorage.setItem('Language', lang)
    } else {
      LocalStorage.removeItem('Language')
    }
  })

  app.use(i18n)
}
