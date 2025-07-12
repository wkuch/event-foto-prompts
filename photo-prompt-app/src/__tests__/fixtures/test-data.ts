export const testUsers = {
  organizer: {
    id: 'test-user-1',
    name: 'Test Organizer',
    email: 'organizer@test.com',
  },
  anotherUser: {
    id: 'test-user-2',
    name: 'Another User',
    email: 'another@test.com',
  }
}

export const testEvents = {
  wedding: {
    name: 'Sarah & John Wedding',
    slug: 'sarah-john-wedding',
    type: 'wedding',
    description: 'A beautiful wedding celebration',
    settings: {
      allowAnonymousUploads: true,
      moderationRequired: false,
    }
  },
  birthday: {
    name: 'Birthday Party',
    slug: 'birthday-party-2024',
    type: 'birthday',
    description: 'Fun birthday celebration',
  },
  corporate: {
    name: 'Company Retreat',
    slug: 'company-retreat',
    type: 'corporate',
  }
}

export const testPrompts = [
  {
    text: 'Take a photo with someone wearing your favorite color',
    order: 0,
    maxUploads: 10,
  },
  {
    text: 'Capture a candid moment of laughter',
    order: 1,
    maxUploads: 5,
  },
  {
    text: 'Take a group photo with at least 3 people',
    order: 2,
  },
  {
    text: 'Find something that represents love',
    order: 3,
    maxUploads: 20,
  }
]

export const testUploadMetadata = {
  validFile: {
    fileName: 'test-photo.jpg',
    originalName: 'My Amazing Photo.jpg',
    fileSize: 1024000, // 1MB
    mimeType: 'image/jpeg',
    caption: 'Beautiful moment captured!',
    uploaderName: 'Guest User',
    uploaderInfo: {
      browser: 'Chrome',
      device: 'iPhone',
    }
  },
  largeFile: {
    fileName: 'large-photo.jpg',
    originalName: 'Large Photo.jpg',
    fileSize: 15 * 1024 * 1024, // 15MB (over limit)
    mimeType: 'image/jpeg',
  },
  invalidFile: {
    fileName: 'document.pdf',
    originalName: 'Document.pdf',
    fileSize: 100000,
    mimeType: 'application/pdf',
  }
}