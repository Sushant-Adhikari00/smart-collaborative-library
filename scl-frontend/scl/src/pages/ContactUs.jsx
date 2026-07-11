import React from 'react';

const ContactUs = () => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] bg-base-200">
      <div className="card w-full max-w-md bg-base-100 shadow-xl p-8 text-center">
        <h2 className="text-3xl font-bold text-primary mb-4">Contact Us</h2>
        <p className="text-lg text-base-content/80 mb-6">
          We'd love to collaborate with you!
        </p>
        <p className="text-base text-base-content/70">
          For business inquiries, partnerships, or any other collaboration opportunities,
          please reach out to us at:
        </p>
        <a
          href="mailto:collaboration@notesapp.com"
          className="text-primary font-bold text-xl mt-4 hover:underline"
        >
          collaboration@notesapp.com
        </a>
        <p className="text-sm text-base-content/60 mt-6">
          We look forward to hearing from you!
        </p>
      </div>
    </div>
  );
};

export default ContactUs;
