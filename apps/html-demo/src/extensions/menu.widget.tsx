/** @jsxImportSource preact */
import {
  defineHtmlComponent,
  list,
  string,
} from '@xmazu/openenvxee-extensions';
import {
  Button,
  Heading,
  Paragraph,
  Section,
} from '@xmazu/openenvxee-extensions/html';

const defaultSections = [
  {
    title: 'Przystawka',
    description: '',
    dishes: [
      { name: 'Paszteciki z konfiturą żurawinową' },
      {
        name: 'Tatar z pomidorów/warzywne ragout/krokiet ziemniaczany/palony por',
      },
    ],
  },
  {
    title: 'Zupa',
    description: '',
    dishes: [{ name: 'Tradycyjny rosół z wkładką' }],
  },
  {
    title: 'Danie główne',
    description: '',
    dishes: [
      {
        name: 'Polędwiczki w kremowym sosie i szparagi zapiekane w beszamelu',
      },
      {
        name: 'Arancini z kaszy bulgur/ragout z sezonowych warzyw w sosie maślanym',
      },
    ],
  },
  {
    title: 'Deser',
    description: '',
    dishes: [{ name: 'Gulasz wołowy w ciemnym sosie paprykowym' }],
  },
  {
    title: 'Pierwsze Danie Gorące',
    description: '',
    dishes: [{ name: 'Gulasz wołowy w ciemnym sosie paprykowym' }],
  },
  {
    title: 'Drugie Danie Gorące',
    description: '',
    dishes: [{ name: 'Gulasz wołowy w ciemnym sosie paprykowym' }],
  },
];

type MenuSection = (typeof defaultSections)[number];
interface MenuProps {
  sections: MenuSection[];
}

function addSection(props: MenuProps): Partial<MenuProps> {
  return {
    sections: [
      ...props.sections,
      { title: 'Nowa sekcja', description: '', dishes: [{ name: '' }] },
    ],
  };
}

function addDish(props: MenuProps, sectionIndex: number): Partial<MenuProps> {
  return {
    sections: props.sections.map((section, index) =>
      index === sectionIndex
        ? { ...section, dishes: [...section.dishes, { name: '' }] }
        : section
    ),
  };
}

/** Wedding menu — editable in the center via bind; structure via onClick + setProps. */
export const menuWidget = defineHtmlComponent({
  id: 'wm.menu',
  label: 'Wedding menu',
  props: {
    sections: list(
      {
        title: string({ label: 'Sekcja', default: 'Przystawka' }),
        description: string({ label: 'Opis', default: '' }),
        dishes: list(
          { name: string({ label: 'Danie', default: '' }) },
          { label: 'Dania', default: [{ name: '' }] }
        ),
      },
      { label: 'Sekcje', default: defaultSections }
    ),
  },
  render({ props, setProps }) {
    return (
      <Section background="#fafaf9" padding={24}>
        <Heading level={1}>Menu weselne</Heading>
        <Paragraph color="#6b7280">
          Kliknij tytuł, opis lub danie, aby edytować. Użyj przycisków, aby
          dodać sekcje i dania.
        </Paragraph>
        {props.sections.map((section, sectionIndex) => (
          <Section background="#ffffff" key={String(sectionIndex)} padding={16}>
            <Heading bind={`sections.${sectionIndex}.title`} level={3}>
              {section.title}
            </Heading>
            {section.description ? (
              <Paragraph bind={`sections.${sectionIndex}.description`}>
                {section.description}
              </Paragraph>
            ) : null}
            {section.dishes.map((dish, dishIndex) => (
              <Paragraph
                bind={`sections.${sectionIndex}.dishes.${dishIndex}.name`}
                key={String(dishIndex)}
              >
                {dish.name}
              </Paragraph>
            ))}
            <Button onClick={() => setProps(addDish(props, sectionIndex))}>
              + danie
            </Button>
          </Section>
        ))}
        <Button onClick={() => setProps(addSection(props))}>+ sekcja</Button>
      </Section>
    );
  },
});
