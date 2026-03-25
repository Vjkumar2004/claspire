// Test the new avatar filename generation
import { generateSafeFilename } from '@/lib/file-validation'

// Test cases
const testCases = [
  {
    originalName: 'profile.jpg',
    userId: 'user123',
    type: 'avatar',
    expected: 'avatar/user123_avatar.jpg'
  },
  {
    originalName: 'my-photo.png',
    userId: 'user456',
    type: 'avatar',
    expected: 'avatar/user456_avatar.png'
  },
  {
    originalName: 'document.pdf',
    userId: 'user789',
    type: 'avatar',
    expected: 'Should throw error - invalid extension'
  },
  {
    originalName: 'other-image.webp',
    userId: 'user123',
    type: 'misc',
    expected: 'Should generate unique filename'
  }
]

console.log('Testing avatar filename generation...')

testCases.forEach((testCase, index) => {
  try {
    const result = generateSafeFilename(testCase.originalName, testCase.userId, testCase.type)
    console.log(`Test ${index + 1}: ${testCase.originalName} -> ${result}`)
    
    if (testCase.type === 'avatar') {
      const isConsistent = result.includes(`${testCase.userId}_avatar`)
      console.log(`✅ Consistent naming: ${isConsistent}`)
    }
  } catch (error) {
    console.log(`Test ${index + 1}: Error - ${error.message}`)
  }
})
