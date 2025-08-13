import LazyImage from '@/components/LazyImage.vue';

describe('<LazyImage />', () => {
  it('renders', () => {
    cy.intercept('GET', '/images/favicon.png', (req) => {
      req.reply({
        fixture: 'images/favicon.png',
        delay: 3000,
      });
    });
    cy.mount({
      render() {
        return h('div', { class: 'p-4' }, [
          h('div', {}, 'Default'),
          h(LazyImage),
          h('div', {}, 'Fix Size'),
          h('div', { class: 'w-24 h-24' }, h(LazyImage)),
          h('div', {}, 'Load Image'),
          h(
            'div',
            { class: 'w-24 h-24' },
            h(LazyImage, { src: '/images/favicon.png' })
          ),
           h('div', {}, 'Rounded'),
           h(
            'div',
            h(LazyImage, { class: '!w-24 !h-24 !rounded-full overflow-hidden', src: '/images/favicon.png' })
          ),
        ]);
      },
    });
  });
});
