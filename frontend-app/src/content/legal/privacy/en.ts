import type { LegalDoc } from '../types';

const doc: LegalDoc = {
  title: '11 On Field Privacy Policy',
  intro: [
    'Welcome to the official website of the 11 On Field football reality TV programme. We are fully committed to protecting the privacy and personal data of users who visit the website, register for the trials or interact with us. This Privacy Policy explains how we collect, process and protect your information.',
  ],
  sections: [
    {
      title: '1. Information we collect',
      lead: ['We collect the following types of data to improve the user experience and to organise the programme:'],
      items: [
        ['Trial / event registration details:', 'Full name, date of birth, ID card/passport number, phone number, email and permanent address.'],
        ['Player (contestant) profile:', 'Height, weight, playing position, injury history, clubs/teams played for, and football skill videos/photos uploaded by the contestant.'],
        ['Online interactions:', 'Comments, votes (for favourite players), online surveys and questions sent to the producer.'],
        ['Automatic technical data:', 'IP address, browser type, operating system, access times and the pages (URLs) you viewed on the website.'],
      ],
    },
    {
      title: '2. How we use your information',
      lead: ['11 On Field uses your personal information for the following lawful purposes:'],
      items: [
        ['Trial screening:', 'Scoring, grouping by age, planning layouts and managing the flow of people on live trial days.'],
        ['Identity verification:', 'Confirming registered contestant details, checking injury insurance paperwork and assigning the correct shirt numbers.'],
        ['Contact and notifications:', 'Sending selection results, the time and place of the next rounds, or the broadcast schedule by email/SMS.'],
        ['Audience interaction:', 'Running online voting and the electronic ticket (e-ticket) gates for friendly matches and the final.'],
        ['Lawful promotion:', 'Using skill photos/videos (with the contestant\'s consent) to produce promotional material or to broadcast in reality TV episodes.'],
      ],
    },
    {
      title: '3. Sharing your information',
      lead: ['We will never sell, rent or trade your personal information to any third party for their own commercial purposes. Information is only shared within the following limits:'],
      items: [
        ['Production crew and broadcast partners:', 'Shared with co-producers, editors, the technical team, the scouting panel and official broadcasters for production purposes.'],
        ['Insurance & medical providers:', 'Mandatory personal details are provided to on-site medical partners and sports insurers to protect players if they are injured on the pitch.'],
        ['Competent state authorities:', 'When a written request is made by the authorities for public security or for licensing events at stadiums.'],
      ],
    },
    {
      title: '4. Information security',
      lead: ['11 On Field applies the strictest technical and organisational security measures to protect your data:'],
      items: [
        ['Encryption:', 'All data transmitted between your device and our systems is encrypted with the SSL (Secure Sockets Layer) protocol.'],
        ['Access control:', 'Only specifically authorised members of the crew can access contestant data, on a need-to-know basis.'],
        ['Secure storage:', 'The database is stored on secure cloud servers with 24/7 firewall monitoring and automatic backups to prevent any loss of information.'],
      ],
    },
    {
      title: '5. Your rights',
      items: [
        ['Access and correction:', 'You can log in to your account on the website to check, update or correct any inaccurate information in your player profile.'],
        ['Withdrawing consent / deleting data:', 'You can ask the organisers to cancel your trial entry and permanently delete the sensitive data you provided by contacting us through the official support channel.'],
      ],
      notes: ['Note: deleting your registration while the programme is in production may disqualify you from the following rounds, as your identity can no longer be verified.'],
    },
    {
      title: '6. Cookies and tracking technologies',
      lead: [
        'Our website uses "cookies" (small text files placed on your computer) to recognise your browser, remember your login and analyse online traffic.',
        'Cookies help us improve the website, speed up page loading and show the football and entertainment content most relevant to you.',
        'You can turn off cookies in your browser settings, but this may affect how smoothly some interactive features on the site work.',
      ],
    },
    {
      title: '7. Changes to this policy',
      lead: [
        'This Privacy Policy may be updated or adjusted at any time to reflect how the programme actually operates or changes in Vietnamese law.',
        'Any major change will be published on this page with the "Last updated" date at the top so that users can easily keep track.',
        'By continuing to use the website and our services after changes are published, you agree to those changes.',
      ],
    },
  ],
  contact: 'If you have any questions, please contact:',
};

export default doc;
