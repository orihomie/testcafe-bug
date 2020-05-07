import XPathSelector from '../helpers/xpath-selector';
import { helper } from '../helpers/testcafe-helper';
import getRandomInt from '../helpers/common';
import dayjs from 'dayjs';
import assert from 'assert';

const addDriverHack = XPathSelector(
  "//*[text()='Добавить водителя']/ancestor::button"
);

const ownerOrDriver = async (noDriversLimit: boolean, driverNumber: number) => {
  if (noDriversLimit) return 'owner';

  return `drivers[${driverNumber}]`;
};

export const openOsagoPage = async (baseUrl: string) => {
  await helper.amOnPage(baseUrl);
  await helper.setCookie({ name: 'OsagoNew2', value: 'OsagoNew2' });

  const osagoBtn = XPathSelector('//a[text()="Электронное ОСАГО"]');
  await helper.click(osagoBtn);
};

const defaultEmail = 's0m3@tr1ckymail.ru';
const defaultPhone = '00033332451';
const defaultSMSCode = 666666;

export const osagoPage = {
  main: {
    autoNumber: XPathSelector("//*[@id='autoNumber']"),
    calculate: XPathSelector("//*[text()='Продолжить']"),
    forgotOrDontHaveNumber: XPathSelector(
      "//button[contains(text(), 'Забыли')]"
    ),
  },

  async fillMain(autoNumber: string) {
    if (!autoNumber) {
      await helper.click(this.main.forgotOrDontHaveNumber);
      return;
    }

    await helper.appendField(this.main.autoNumber, autoNumber);
    await helper.click(this.main.calculate);
  },

  autoData: {
    mark: XPathSelector("//input[@placeholder='Укажите марку']"),
    model: XPathSelector("//input[@placeholder='Выберите модель']"),
    year: XPathSelector("//input[@placeholder='Выберите год']"),
    power: XPathSelector(
      "//label[text()='Мощность двигателя']/following::div[1]"
    ),
    isIndividualAuto: XPathSelector(
      "//span[contains(text(), 'Цель использования')]"
    ),
    hasNoTrail: XPathSelector(
      "//span[contains(text(), 'Автомобиль категории В, без прицепа')]"
    ),
    prevStep: XPathSelector("//button[text()='Назад'"),
    nextStep: XPathSelector("//button[@type='submit']"),
  },

  async fillAutoData(
    brand: string,
    model: string,
    year: number,
    power: number,
    skipCheckBoxes = true
  ) {
    async function fillMark(markLocator: Selector, mark: string) {
      mark = !mark ? 'Mercedes-Benz' : mark;
      const markSuggestLocator = XPathSelector(
        `//li[ancestor::ul and @value='${mark}'][1]`
      );

      await helper.waitForVisible(markLocator);
      await helper.doubleClick(markLocator);
      await helper.fillField(markLocator, mark);

      const flag = await helper.grabNumberOfVisibleElements(markSuggestLocator);

      if (!flag) {
        await helper.fillField(markLocator, mark);
        await helper.seeElement(markSuggestLocator);
      }

      await helper.click(markSuggestLocator);
    }

    async function fillModel(modelLocator: Selector, model: string) {
      const locator =
        `//li[ancestor::ul]` + (!model ? '[1]' : `[text()='${model}']`);
      const modelSuggestLocator = XPathSelector(locator);

      await helper.click(modelLocator);

      const flag = await helper.grabNumberOfVisibleElements(
        modelSuggestLocator
      );

      if (!flag) {
        await helper.fillField(modelLocator, model);
        await helper.seeElement(modelSuggestLocator);
      }

      await helper.click(modelSuggestLocator);
    }

    async function fillYear(yearLocator: Selector, year: number) {
      const locator =
        '//li[ancestor::ul]' + (!year ? '[1]' : `[@value='${year}']`);
      const yearSuggestLocator = XPathSelector(locator);

      await helper.click(yearLocator);

      const flag = await helper.grabNumberOfVisibleElements(yearSuggestLocator);

      if (!flag) {
        await helper.fillField(yearLocator, year.toString());
        await helper.seeElement(yearSuggestLocator);
      }

      await helper.click(yearSuggestLocator);
    }

    async function fillPower(powerLocator: Selector, power: number) {
      let locator =
        '//li[parent::ul and preceding::label]' +
        (!year ? '[1]' : `[contains(text(), '${power}')]`);

      await helper.click(powerLocator);

      const flag = await XPathSelector(locator).count;

      if (!flag) {
        locator = '//li[parent::ul and preceding::label][1]';
      }

      // console.log(locator);

      await helper.scrollTo(XPathSelector(locator));
      await helper.click(XPathSelector(locator));
    }

    await fillMark(this.autoData.mark, brand);
    await fillModel(this.autoData.model, model);
    await fillYear(this.autoData.year, year);
    await fillPower(this.autoData.power, power);

    if (skipCheckBoxes) {
      await helper.click(this.autoData.nextStep);
      return;
    }

    const individualAutoCheckBox = await XPathSelector(
      `//span[contains(text(), 'Цель использования')]/preceding::input[@type='checkbox']`
    );

    const clickElementAndCheckOtherElementGotDisabled = async (
      checkBoxClickElement: Selector,
      checkBoxReadElement: Selector,
      otherElement: Selector
    ) => {
      await helper.click(checkBoxClickElement);
      assert.deepEqual(await checkBoxReadElement.checked, false);
      assert.deepEqual(await otherElement.getAttribute('disabled'), '');

      await helper.click(checkBoxClickElement);
      assert.deepEqual(await checkBoxReadElement.checked, true);
      assert.deepEqual(await otherElement.getAttribute('disabled'), undefined);
    };

    await clickElementAndCheckOtherElementGotDisabled(
      this.autoData.isIndividualAuto,
      individualAutoCheckBox,
      this.autoData.nextStep
    );

    const hasNoTrailCheckBox = await XPathSelector(
      "//span[contains(text(), 'В, без прицепа')]/preceding::input[@type = 'checkbox'][1]"
    );

    await clickElementAndCheckOtherElementGotDisabled(
      this.autoData.hasNoTrail,
      hasNoTrailCheckBox,
      this.autoData.nextStep
    );

    await helper.click(this.autoData.nextStep);
  },

  periodAndRegion: {
    newPolicyStartDate: XPathSelector("//input[@id='policyStartDate']"),
    ownerRegistryCity: XPathSelector("//textarea[@id='registration']"),

    prevStep: XPathSelector("//button[text()='Назад']"),
    nextStep: XPathSelector("//button[@type='submit']"),
    errorLabel: XPathSelector("//span[contains(@class, 'error')]"),
  },

  async fillPeriodAndRegion(startDate = '', region = '') {
    // let date = new Date(Date.now() + 24 * 60 * 60 * 1000);
    startDate = !startDate
      ? dayjs().add(getRandomInt(7, 28), 'day').format('DD.MM.YYYY')
      : startDate;
    region = !region ? 'г М' : region;

    await helper.fillField(this.periodAndRegion.newPolicyStartDate, startDate);

    await helper.doubleClick(this.periodAndRegion.ownerRegistryCity);
    await helper.fillField(this.periodAndRegion.ownerRegistryCity, region);

    const regionSuggestLocator = XPathSelector(
      `//li[contains(@value, '${region}')]`
    );
    await helper.waitForVisible(regionSuggestLocator);
    await helper.click(regionSuggestLocator);

    await helper.waitForVisible(this.periodAndRegion.nextStep);

    assert.deepStrictEqual(
      await this.periodAndRegion.errorLabel.filterVisible().count,
      0
    );
    await helper.click(this.periodAndRegion.nextStep);
  },

  driversData: {
    noDriversLimit: "//div[text()='Без ограничений']",
    addDriver: addDriverHack,

    // todo fix html
    deleteDriver: (driverNumber: number) =>
      XPathSelector(
        `//*[@data-test='step-title' and contains(text(), '${driverNumber}')]//following::button[1]`
      ),
    clearFields: (driverNumber: number) =>
      XPathSelector(
        `//*[@data-test='step-title' and contains(text(), '${driverNumber}')]//following::button[2]`
      ),

    lastName: async (noDriversLimit: boolean, driverNumber: number) => {
      const person = await ownerOrDriver(noDriversLimit, driverNumber);
      return XPathSelector(`//input[@id='${person}.lastName']`);
    },
    firstName: async (noDriversLimit: boolean, driverNumber: number) => {
      const person = await ownerOrDriver(noDriversLimit, driverNumber);
      return XPathSelector(`//input[@id='${person}.firstName']`);
    },
    middleName: async (noDriversLimit: boolean, driverNumber: number) => {
      const person = await ownerOrDriver(noDriversLimit, driverNumber);
      return XPathSelector(`//input[@id='${person}.middleName']`);
    },
    birthDate: async (noDriversLimit: boolean, driverNumber: number) => {
      const person = await ownerOrDriver(noDriversLimit, driverNumber);
      return XPathSelector(`//input[@id='${person}.birthDate']`);
    },
    idSeriesNumber: async (noDriversLimit: boolean, driverNumber: number) => {
      if (noDriversLimit)
        return XPathSelector(`//input[@id='owner.passportNumber']`);
      else
        return XPathSelector(
          `//input[@id='drivers[${driverNumber}].drivingLicense']`
        );
    },
    expStartDate: async (noDriversLimit: boolean, driverNumber: number) => {
      if (noDriversLimit)
        return XPathSelector(`//input[@id='owner.passportObtainingDate']`);
      else
        return XPathSelector(
          `//input[@id='drivers[${driverNumber}].experienceStartDate']`
        );
    },
    agreeWithRules: "//span[contains(text(), 'Согласен')]",

    autoIdSelect: (autoIdBy: string) =>
      XPathSelector(
        `//input[@type='radio' and @value='${autoIdBy}']/following::span[1]`
      ),
    autoIdValue: (autoIdBy: string) =>
      XPathSelector(
        `//input[@type='radio' and @value='${autoIdBy}']/following::input[@type='text']`
      ),

    prevStep: XPathSelector("//button[text()='Назад']"),
    nextStep: XPathSelector("//button[@type='submit']"),
    errorLabel: XPathSelector("//span[contains(@class, 'error')]"),
  },

  async fillDriversData(
    noDriversLimit: boolean,
    drivers: Array<Record<string, any>>,
    autoIdentifier: Record<string, string>
  ) {
    const fillSingleDriverData = async (
      driverNum: number,
      driverData: Record<string, string>
    ) => {
      await helper.fillField(
        await this.driversData.lastName(noDriversLimit, driverNum),
        driverData.LastName
      );
      await helper.fillField(
        await this.driversData.firstName(noDriversLimit, driverNum),
        driverData.FirstName
      );
      await helper.fillField(
        await this.driversData.middleName(noDriversLimit, driverNum),
        driverData.MiddleName
      );
      await helper.fillField(
        await this.driversData.birthDate(noDriversLimit, driverNum),
        dayjs(driverData.BirthDate).format('DD.MM.YYYY')
      );

      const driverId = ((driverData.Passport ||
        driverData.License) as unknown) as Record<string, string>;
      const seriesNumber = `${driverId.Series}${driverId.Number}`;
      const date = dayjs(driverId.Date || driverId.IssueDate).format(
        'DD.MM.YYYY'
      );

      await helper.fillField(
        await this.driversData.idSeriesNumber(noDriversLimit, driverNum),
        seriesNumber
      );
      await helper.fillField(
        await this.driversData.expStartDate(noDriversLimit, driverNum),
        date
      );
    };

    const limitLocator = XPathSelector(
      this.driversData.noDriversLimit + '/preceding::input[1]'
    );

    const limitEnabled =
      (await helper.grabAttributeFrom(limitLocator, 'value')) === 'true';

    if (noDriversLimit !== limitEnabled) {
      await helper.click(XPathSelector(this.driversData.noDriversLimit));
      await this.fillAutoIdentifier(autoIdentifier);
    }

    for (let i = 0; i < drivers.length; i++) {
      try {
        await fillSingleDriverData(i, drivers[i]);
      } catch (err) {
        if (err instanceof TypeError) {
          throw new TypeError(`Заполнение информации о водителе #${i + 1}/${
            drivers.length
          } упало из-за пустых данных
					Водители: ${drivers}`);
        }

        throw err;
      }

      if (drivers.length - i - 1 > 0) {
        const driversCountLocator = XPathSelector(
          "//*[@data-test='step-title']"
        );
        const driversCount = await helper.grabNumberOfVisibleElements(
          driversCountLocator
        );

        if (drivers.length > driversCount) {
          await helper.click(this.driversData.addDriver);
        }

        if (drivers.length < driversCount) {
          await helper.click(
            this.driversData.deleteDriver(drivers.length - i - 1)
          );
        }
      }
    }

    const checkBox = XPathSelector(
      this.driversData.agreeWithRules + '//preceding::input[1]'
    );
    const agreeCheckBox = await XPathSelector(this.driversData.agreeWithRules);
    const offsetX = -(await agreeCheckBox.clientWidth) / 2;
    await helper.click(
      agreeCheckBox,
      new (class implements ClickActionOptions {
        offsetX: number = offsetX;
      })()
    );

    assert.deepStrictEqual(await checkBox.checked, false);

    await helper.click(
      agreeCheckBox,
      new (class implements ClickActionOptions {
        offsetX: number = offsetX;
      })()
    );
    assert.deepStrictEqual(await checkBox.checked, true);

    const errors = await this.driversData.errorLabel;

    let errorMsg = '';
    if ((await errors.filterVisible().count) > 0) {
      errorMsg = `На странице заполнения водителей есть ошибки: ${await errors.textContent}`;
    }

    assert.deepStrictEqual(await errors.filterVisible().count, 0, errorMsg);
    await helper.click(this.driversData.nextStep);
  },

  insuranceProps: {
    driversInfo: XPathSelector(
      "//button[@data-test='drivers-step']/preceding::div[child::label]"
    ),
    editDrivers: XPathSelector("//button[@data-test='drivers-step']"),
    autoInfo: XPathSelector(
      "//button[@data-test='auto-step']/preceding::div[1]"
    ),
    editAuto: XPathSelector("//button[@data-test='auto-step']"),
    periodAndRegionInfo: XPathSelector(
      "//button[@data-test='region-step']/preceding::div[1]"
    ),
    editPeriodAndRegion: XPathSelector("//button[@data-test='region-step']"),

    emailField: XPathSelector("//input[@id='email']"),
    sendEmailButton: XPathSelector("//input[@id='email']/following::button[1]"),
  },

  awaitInsurancePropositions: async function (
    timeout = 190,
    intervalPause = 5000,
    awaitAll = true
  ) {
    assert.deepStrictEqual(
      (await XPathSelector("//div[text()='Рейтинг']", 5000).filterVisible()
        .count) > 0,
      true
    );
    const finishDate = new Date(Date.now() + 1000 * timeout);
    console.log(
      `Подожду ${timeout} секунд прогрузку всех предложений, до ${finishDate}`
    );

    const successLocator = XPathSelector(
      '//*[contains(text(), "Оформить") or contains(text(), "Расчёт")]'
    );
    let loadedRowsCount = 0;
    let totalRowsCount = 0;

    do {
      loadedRowsCount = await helper.grabNumberOfVisibleElements(
        successLocator
      );
      totalRowsCount = await helper.grabNumberOfVisibleElements(
        XPathSelector(
          "//div[child::div[contains(text(), 'Компания')]]/following::div[1]/div"
        )
      );

      console.log(
        `Вижу ${loadedRowsCount} загрузившихся строк из общего количества ${totalRowsCount}`
      );

      if (!awaitAll && loadedRowsCount > 0) {
        return;
      }

      if (loadedRowsCount >= totalRowsCount) break;

      console.log(`Жду ${intervalPause / 1000} секунд...`);
      await new Promise((resolve) => setTimeout(resolve, intervalPause));
    } while (new Date(Date.now()) < finishDate);

    assert.deepStrictEqual(loadedRowsCount >= totalRowsCount, true);
  },

  async proceedWithSomeInsurer(
    timeout = 190,
    intervalPause = 5000,
    awaitAll = true
  ) {
    await this.awaitInsurancePropositions(timeout, intervalPause, awaitAll);

    const extendLocator = XPathSelector('//button[contains(., "Продлить")]');
    const extendCount = await helper.grabNumberOfVisibleElements(extendLocator);

    const propsLocator = XPathSelector('//button[contains(., "Оформить")]');
    const props = await helper.grabNumberOfVisibleElements(propsLocator);

    assert.deepStrictEqual(
      props + extendCount !== 0,
      true,
      'Недоступно ни оформление, ни продление'
    );

    if (extendCount !== 0 && Math.random() > 0.5) {
      console.log(`Буду продлевать`);
      await helper.waitForVisible(extendLocator, 2);
      await helper.click(extendLocator);
    } else {
      const lowerLimit = extendCount === 0 ? 1 : 2;
      const chosenPropNumber = getRandomInt(lowerLimit, props);
      const randomInsurerLocator = XPathSelector(
        `//div[${chosenPropNumber}]/div/div[5]/button[contains(., 'Оформить')]`
      );
      console.log(
        `Выберу, пожалуй, предложение #${chosenPropNumber}, если считать сверху вниз`
      );

      await helper.click(randomInsurerLocator);
    }
  },

  ownerAndInsurerData: {
    owner: {
      clearFields: XPathSelector(
        "//h2[contains(text(), 'собственник')]/following::button[1]"
      ),
      lastName: XPathSelector("//input[@id='owner.lastName']"),
      firstName: XPathSelector("//input[@id='owner.firstName']"),
      middleName: XPathSelector("//input[@id='owner.middleName']"),
      idSeriesNumber: XPathSelector("//input[@id='owner.passportNumber']"),
      idObtainDate: XPathSelector("//input[@id='owner.passportObtainingDate']"),
      birthDate: XPathSelector("//input[@id='owner.birthDate']"),
      registryAddress: XPathSelector("//textarea[@id='owner.address']"),
      flat: XPathSelector("//input[@id='owner.addressFlat']"),
      isInsurer: "//div[contains(text(), 'Является')]",
    },
    insurer: {
      clearFields: XPathSelector(
        "//h2[contains(text(), 'страховат')]/following::button[1]"
      ),
      lastName: XPathSelector("//input[@id='insurer.lastName']"),
      firstName: XPathSelector("//input[@id='insurer.firstName']"),
      middleName: XPathSelector("//input[@id='insurer.middleName']"),
      idSeriesNumber: XPathSelector("//input[@id='insurer.passportNumber']"),
      idObtainDate: XPathSelector(
        "//input[@id='insurer.passportObtainingDate']"
      ),
      birthDate: XPathSelector("//input[@id='insurer.birthDate']"),
      registryAddress: XPathSelector("//textarea[@id='insurer.address']"),
      flat: XPathSelector("//input[@id='insurer.addressFlat']"),
    },
    prevStep: XPathSelector("//button[text()='Назад']"),
    nextStep: XPathSelector("//button[@type='submit']"),
    errorLabel: XPathSelector("//span[contains(@class, 'error')]"),
  },

  async fillInsurerData(
    ownerData = null,
    insurerData = null,
    goToNextStep = true
  ): Promise<Record<string, any>> {
    async function fillPersonData(personLocators: any, personData: any) {
      await helper.fillField(personLocators.lastName, personData.LastName);
      await helper.fillField(personLocators.firstName, personData.FirstName);
      await helper.fillField(personLocators.middleName, personData.MiddleName);

      const birthDate = dayjs(personData.BirthDate).format('DD.MM.YYYY');
      await helper.fillField(personLocators.birthDate, birthDate);

      const personId = ((personData.Passport ||
        personData.License) as unknown) as Record<string, string>;
      const seriesNumber = `${personId.Series}${personId.Number}`;
      await helper.fillField(personLocators.idSeriesNumber, seriesNumber);

      const idObtainingDate = dayjs(
        personData.Date || personData.IssueDate
      ).format('DD.MM.YYYY');
      await helper.fillField(personLocators.idObtainDate, idObtainingDate);

      const address = personData.RegistrationAddress.split(', КВ. ');
      await helper.fillField(personLocators.registryAddress, address[0]);

      await helper.wait(1);
      const suggestLocator = await XPathSelector(
        "//label[text()='Адрес регистрации']/following::li[1][@label]",
        5000
      );

      assert.deepStrictEqual(
        (await suggestLocator.filterVisible().count) > 0,
        true,
        'Выпадающий список с адресом не появился'
      );
      await helper.click(suggestLocator);

      if (address.length !== 1)
        await helper.fillField(personLocators.flat, address[1]);
    }

    async function checkIfInsurerIsOwner(
      owner: any,
      insurer: any
    ): Promise<boolean> {
      return (
        insurer.FullName === owner.FullName &&
        insurer.BirthDate === owner.BirthDate
      );
    }

    const filledData: { insurerData?: any; ownerData?: any } = {};

    await fillPersonData(this.ownerAndInsurerData.owner, ownerData);

    filledData.ownerData = ownerData;

    if (!(await checkIfInsurerIsOwner(ownerData, insurerData))) {
      await helper.click(
        XPathSelector(this.ownerAndInsurerData.owner.isInsurer)
      );
      const checkBox =
        this.ownerAndInsurerData.owner.isInsurer + '/preceding::input[1]';
      assert.deepStrictEqual(await XPathSelector(checkBox).checked, false);

      const ownerBlock = XPathSelector("//h2[text()='Данные страхователя']");
      assert.deepStrictEqual(
        (await ownerBlock.filterVisible().count) > 0,
        true,
        'Не раскрылся блок "Данные страхователя"'
      );

      await fillPersonData(this.ownerAndInsurerData.insurer, insurerData);

      filledData.insurerData = insurerData;
    }

    if (goToNextStep) {
      assert.deepStrictEqual(
        await this.ownerAndInsurerData.errorLabel.filterVisible().count,
        0,
        'На странице присутствуют ошибки заполнения'
      );

      await helper.click(this.ownerAndInsurerData.nextStep);
    }
    return filledData;
  },

  async checkInsurerData(insurerData: any, ownerData = null) {
    // async function checkOwnership(shouldBe: boolean) {
    //   const addDriverButtons = await helper.grabNumberOfVisibleElements(
    //     XPathSelector("//h2[text()='Данные страхователя']"));
    //
    //   const isOwner = addDriverButtons === 0;
    //
    //   assert.deepStrictEqual(isOwner, shouldBe);
    // }

    async function checkPersonsData(personLocators: any, personData: any) {
      assert.deepStrictEqual(
        await personLocators.lastName.value.toLowerCase(),
        personData.LastName.toLowerCase()
      );

      assert.deepStrictEqual(
        await personLocators.firstName.value.toLowerCase(),
        personData.FirstName?.toLowerCase()
      );

      assert.deepStrictEqual(
        await personLocators.middleName.value.toLowerCase(),
        personData.MiddleName.toLowerCase()
      );

      const birthDate = dayjs(personData.BirthDate).format('DD.MM.YYYY');
      assert.deepStrictEqual(await personLocators.birthDate.value, birthDate);

      const personId = ((personData.Passport ||
        personData.License) as unknown) as Record<string, string>;
      const seriesNumber = `${personId.Series}${personId.Number}`;
      assert.deepStrictEqual(
        await personLocators.idSeriesNumber.value,
        seriesNumber
      );

      const idObtainingDate = dayjs(
        personData.Date || personData.IssueDate
      ).format('DD.MM.YYYY');
      assert.deepStrictEqual(
        personLocators.idObtainDate.value,
        idObtainingDate
      );

      const fullAddress = personData.RegistrationAddress.split(', КВ. ');

      assert.deepStrictEqual(
        personLocators.registryAddress.value.toLowerCase(),
        fullAddress[0]
      );

      assert.deepStrictEqual(await personData.flat.value, fullAddress[1]);
    }

    await checkPersonsData(this.ownerAndInsurerData.owner, ownerData);

    if (insurerData) {
      await helper.see('Данные собственника', XPathSelector('*'));

      await checkPersonsData(this.ownerAndInsurerData.insurer, insurerData);
    }
  },

  autoRegData: {
    carNumber: XPathSelector("//input[@id='autoNumber']"),
    autoIdSelect: (autoIdBy: string) =>
      osagoPage.driversData.autoIdSelect(autoIdBy),
    autoIdValue: (autoIdBy: string) =>
      osagoPage.driversData.autoIdValue(autoIdBy),
    autoIdDocTypeSelect: (autoIdTypeBy: string) =>
      `//label[text()='Документ']/following::span[text()='${autoIdTypeBy}']`,
    autoIdDocTypeValue: (autoIdTypeBy: string) =>
      XPathSelector(
        `//label[text()='Документ']/following::span[text()='${autoIdTypeBy}']/following::input[@type='text'][1]`
      ),
    autoIdDocTypeObtainDate: XPathSelector(
      "//input[@id='documentObtainingDate']"
    ),
    dcNumber: XPathSelector("//input[@id='dcNumber']"),
    dcExpireDate: XPathSelector("//input[@id='dcDate']"),
    prevStep: XPathSelector("//button[text()='Назад']"),
    nextStep: XPathSelector("//button[@type='submit']"),
    errorLabel: XPathSelector("//span[contains(@class, 'error')]"),
  },

  async fillAutoIdentifier(autoIdentifier: Record<string, string>) {
    const key = Object.keys(autoIdentifier)[0];

    await helper.click(this.autoRegData.autoIdSelect(key));
    // await helper.clearField(this.autoRegData.autoIdValue(key));
    await helper.fillField(
      this.autoRegData.autoIdValue(key),
      autoIdentifier[key]
    );
  },

  async fillAutoIdentifierType(autoIdentifierType: Record<string, any>) {
    const docTypes: Record<number, string> = {
      1: 'ПТС',
      2: 'СТС',
      3: 'еПТС',
    };

    const key = docTypes[autoIdentifierType.DocumentType];
    await helper.click(
      XPathSelector(this.autoRegData.autoIdDocTypeSelect(key))
    );
    // await helper.clearField(this.autoRegData.autoIdDocTypeValue(key));
    await helper.fillField(
      this.autoRegData.autoIdDocTypeValue(key),
      autoIdentifierType.Series + autoIdentifierType.Number
    );
    // await helper.clearField(this.autoRegData.autoIdDocTypeObtainDate);
    await helper.fillField(
      this.autoRegData.autoIdDocTypeObtainDate,
      dayjs(autoIdentifierType.Date).format('DD.MM.YYYY')
    );
  },

  async fillAutoRegData(
    carNumber: string,
    autoIdentifier: Record<string, string>,
    autoIdentifierType: Record<string, any>,
    diagnosticCard?: Record<string, any>
  ) {
    await helper.fillField(this.autoRegData.carNumber, carNumber);

    await this.fillAutoIdentifier(autoIdentifier);
    await this.fillAutoIdentifierType(autoIdentifierType);

    console.log(diagnosticCard, 'is skipped');

    // if (diagnosticCard) {
    //   await helper.fillField(this.autoRegData.dcNumber, diagnosticCard.Number);
    //
    //   const expireDate = dayjs(diagnosticCard.DateNextTO).format("DD.MM.YYYY");
    //   await helper.fillField(this.autoRegData.dcNumber, expireDate);
    // }

    await helper.waitForVisible(this.autoRegData.nextStep, 2);
    assert.deepStrictEqual(await this.autoRegData.errorLabel.count, 0);

    assert.deepStrictEqual(await this.autoRegData.nextStep.count, 1);
    await helper.click(this.autoRegData.nextStep);
  },

  contactsData: {
    email: XPathSelector("//input[@id='email']"),
    phone: XPathSelector("//input[@id='phone']"),
    smsCode: XPathSelector("//input[@id='code']"),
    getCodeAgain: XPathSelector("//div[text()='Получить код ещё раз']"),

    prevStep: XPathSelector("//button[text()='Назад']"),
    nextStep: XPathSelector("//button[@type='submit']"),
    errorLabel: XPathSelector('//p[preceding::label[@for]]'),
  },

  async fillContactsData(email?: string, phone?: string) {
    email = !email ? defaultEmail : email;
    phone = !phone ? defaultPhone : phone;

    await helper.fillField(this.contactsData.email, email);
    await helper.fillField(this.contactsData.phone, phone);
    await helper.click(this.contactsData.nextStep);

    const smsButton = XPathSelector("//button[text()='Получить код по sms']");

    do {
      await helper.wait(1);
    } while ((await smsButton.filterVisible().count) !== 0);

    if (await helper.grabNumberOfVisibleElements(this.contactsData.smsCode)) {
      await helper.fillField(
        this.contactsData.smsCode,
        defaultSMSCode.toString()
      );

      assert.deepStrictEqual(
        (await this.contactsData.errorLabel.count) === 0,
        true
      );
      await helper.click(this.contactsData.nextStep);
    }
  },

  confirmationData: {
    insurancePeriodInfo: XPathSelector(
      "//span[contains(text(), 'Период')]/following::span[2]"
    ),
    editInsurancePeriod: XPathSelector(
      "//span[contains(text(), 'Период')]/following::button[1]"
    ),
    insurancePersonInfo: XPathSelector(
      "//span[contains(text(), 'Страхователь')]/following::div[1]"
    ),
    editInsurancePerson: XPathSelector(
      "//span[contains(text(), 'Страхователь')]/following::button[1]"
    ),
    driversDataInfo: XPathSelector(
      "//span[contains(text(), 'управл')]/following::div[1]"
    ),
    editDriversData: XPathSelector(
      "//span[contains(text(), 'управл')]/following::button[1]"
    ),
    autoDataInfo: XPathSelector(
      "//span[contains(text(), 'управл')]/following::button[@data-test='edit'][2]/following::span[1]"
    ),
    editAutoData: XPathSelector(
      "//span[contains(text(), 'управл')]/following::button[@data-test='edit'][2]"
    ),
    autoRegDataInfo: XPathSelector(
      "//span[contains(text(), 'Данные')]/following::span[2]"
    ),
    editAutoRegData: XPathSelector(
      "//span[contains(text(), 'Данные')]/following::button[1]"
    ),
    contactsInfo: XPathSelector(
      "//span[contains(text(), 'Контакт')]/following::div[1]"
    ),
    editContacts: XPathSelector(
      "//span[contains(text(), 'Контакт')]/following::button[1]"
    ),
    prevStep: XPathSelector("//button[text()='Назад']"),
    nextStep: XPathSelector("//button[@type='submit']"),
  },

  async awaitInsurerResponse(timeOutSeconds: number, timeStepSeconds: number) {
    if (!timeOutSeconds) {
      timeOutSeconds = 1000 * 280;
    }

    if (!timeStepSeconds) {
      timeStepSeconds = 1000 * 5;
    }

    console.log('Жду ответ страховой...');

    const timeOutDate = new Date(Date.now() + 1000 * timeOutSeconds);
    const loadingLabelLocator = XPathSelector(
      "//*[contains(text(), 'Проверяем данные') or contains(text(), 'чуть')]"
    );

    do {
      const loadingLabelCount = await helper.grabNumberOfVisibleElements(
        loadingLabelLocator
      );

      if (loadingLabelCount === 0) break;

      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * timeStepSeconds)
      );
    } while (new Date(Date.now()) < timeOutDate);

    await helper.dontSeeElement(loadingLabelLocator);
  },

  async fillConfirmationData() {
    await helper.click(this.confirmationData.nextStep);
  },

  confirmationResults: {
    confResult: XPathSelector('//h1'),
    confInfo: XPathSelector('//h1/following::p'),
    nextStep: async (
      awaitInsurersFunction: any,
      timeOutSec: number,
      timeStepSec: number
    ): Promise<string> => {
      await awaitInsurersFunction(timeOutSec, timeStepSec);

      const needSmsLocator = "//button[@type='submit']";
      const needSms = await helper.grabNumberOfVisibleElements(
        XPathSelector(needSmsLocator)
      );

      if (needSms === 1) {
        return needSmsLocator;
      }

      const backToCalcLocator = "//*[contains(text(), 'к расч')]";
      const proceedToPaymentLocator = "//*[contains(text(), 'к оплате')]";

      const backToCalc = await helper.grabNumberOfVisibleElements(
        XPathSelector(backToCalcLocator)
      );

      if (backToCalc === 1) {
        console.log('Могу только вернуться к расчёту');
        return backToCalcLocator;
      }

      const proceedToPayment = await helper.grabNumberOfVisibleElements(
        XPathSelector(proceedToPaymentLocator)
      );

      if (proceedToPayment === 1) {
        console.log('Ура! Могу переходить к оплате');
        return proceedToPaymentLocator;
      }

      const propsLocator = XPathSelector(
        '//span[contains(text(), "Оформить")]'
      );
      const props = await helper.grabNumberOfVisibleElements(propsLocator);
      console.log(
        `Не могу перейти к оплате у выбранного страхового агента, зато доступно ${props} других`
      );

      const chosenPropNumber = getRandomInt(1, props);
      console.log(
        `Выберу, пожалуй, ${chosenPropNumber}, если считать сверху вних`
      );

      return `//div[${chosenPropNumber}]/div/div/button[contains(text(), 'Оформить')]`;
    },
  },

  async fillConfirmationResuts(
    timeOutSeconds = 600,
    timeSleepSeconds = 10,
    throwOnTimeOut = false
  ) {
    const timeOutDate = new Date(Date.now() + 1000 * timeOutSeconds);

    do {
      const nextStepLocator = await this.confirmationResults.nextStep(
        this.awaitInsurerResponse,
        280,
        5
      );

      if (nextStepLocator.includes('submit')) {
        console.log('Дошли до ввода SMS от страховой, успешно');
        return;
      }

      await helper.click(XPathSelector(nextStepLocator));
      await helper.wait(timeSleepSeconds);

      if (nextStepLocator.toLowerCase().includes('оплате')) {
        const url = await helper.grabCurrentUrl();
        console.log(`В конце концов нахожусь здесь: ${url}`);
        return;
      } else if (nextStepLocator.toLowerCase().includes('к расч')) {
        console.log('Возвращаюсь к расчёту');
        await this.proceedWithSomeInsurer();
        await helper.click(this.ownerAndInsurerData.nextStep);
        await helper.click(this.autoRegData.nextStep);
        await helper.click(this.contactsData.nextStep);
        await helper.click(this.confirmationData.nextStep);
      }
    } while (new Date(Date.now()) < timeOutDate);

    if (throwOnTimeOut) {
      assert.fail('Я устал оформлять ОСАГО');
    }
  },

  emailFooter: {
    email: XPathSelector("//*[@id='email']"),
    sendEmail: XPathSelector("//*[@id='email']/following::button[1]"),
    close: XPathSelector("//*[@id='email']/following::button[2]"),
  },

  async saveCurrentOrderStateByEmail(email: string) {
    await helper.waitForVisible(this.emailFooter.email, 2);
    await helper.fillField(this.emailFooter.email, email);
    await helper.click(this.emailFooter.sendEmail);
    assert.deepStrictEqual((await this.emailFooter.email.count), 0);
    await helper.waitToHide(this.emailFooter.email, 1);
  },
};
